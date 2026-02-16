import {
  CurrentPrice,
  PricePoint,
  ExchangeProvider,
  ExchangeOrderParams,
  ExchangeOrderResult,
  ExchangeOrderStatus,
} from '@/types/market';
import { ForexPair } from './types';
import { FOREX_PAIRS } from './seeds';

// Maps our internal IDs to OANDA instrument names
const INSTRUMENT_MAP: Record<string, string> = {
  eurusd: 'EUR_USD',
  gbpusd: 'GBP_USD',
  usdjpy: 'USD_JPY',
  audusd: 'AUD_USD',
  usdcad: 'USD_CAD',
  usdchf: 'USD_CHF',
};

const REVERSE_INSTRUMENT_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(INSTRUMENT_MAP).map(([k, v]) => [v, k])
);

export class OandaProvider implements ExchangeProvider<ForexPair> {
  marketType = 'forex' as const;
  exchangeId = 'oanda';
  isSimulator = false;

  private baseUrl: string;
  private apiKey: string;
  private accountId: string;
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private lastPrices: Map<string, CurrentPrice> = new Map();

  constructor(config: { apiKey: string; accountId: string; practice: boolean }) {
    this.apiKey = config.apiKey;
    this.accountId = config.accountId;
    this.baseUrl = config.practice
      ? 'https://api-fxpractice.oanda.com/v3'
      : 'https://api-fxtrade.oanda.com/v3';
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initialize(): Promise<void> {
    // Verify account access
    const res = await fetch(`${this.baseUrl}/accounts/${this.accountId}/summary`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`OANDA auth failed: ${res.status} ${await res.text()}`);
    }

    // Fetch initial prices
    await this.tick();

    // Fetch candle history for each instrument
    const instruments = Object.values(INSTRUMENT_MAP);
    const historyPromises = instruments.map(async (instrument) => {
      const assetId = REVERSE_INSTRUMENT_MAP[instrument];
      if (!assetId) return;
      try {
        const res = await fetch(
          `${this.baseUrl}/instruments/${instrument}/candles?granularity=M1&count=100&price=M`,
          { headers: this.headers() }
        );
        if (!res.ok) return;
        const data = await res.json();
        const candles = data.candles || [];
        const history: PricePoint[] = candles
          .filter((c: { complete: boolean }) => c.complete)
          .map((c: { time: string; mid: { o: string; h: string; l: string; c: string }; volume: number }) => ({
            timestamp: new Date(c.time).getTime(),
            open: parseFloat(c.mid.o),
            high: parseFloat(c.mid.h),
            low: parseFloat(c.mid.l),
            close: parseFloat(c.mid.c),
            volume: c.volume || 0,
          }));
        this.priceHistory.set(assetId, history);
      } catch (err) {
        console.warn(`[OANDA] Failed to fetch history for ${instrument}:`, err);
        this.priceHistory.set(assetId, []);
      }
    });
    await Promise.all(historyPromises);
    console.log('[OANDA] Provider initialized');
  }

  async destroy(): Promise<void> {}

  async getAssets(): Promise<ForexPair[]> {
    return FOREX_PAIRS.filter(a => INSTRUMENT_MAP[a.id]);
  }

  async getAsset(id: string): Promise<ForexPair | undefined> {
    return FOREX_PAIRS.find(a => a.id === id);
  }

  async getCurrentPrice(assetId: string): Promise<CurrentPrice> {
    const cached = this.lastPrices.get(assetId);
    if (cached && Date.now() - cached.timestamp < 5000) return cached;

    const instrument = INSTRUMENT_MAP[assetId];
    if (!instrument) throw new Error(`Unknown asset: ${assetId}`);

    try {
      const res = await fetch(
        `${this.baseUrl}/accounts/${this.accountId}/pricing?instruments=${instrument}`,
        { headers: this.headers() }
      );
      if (!res.ok) throw new Error(`OANDA pricing failed: ${res.status}`);
      const data = await res.json();
      const pricing = data.prices?.[0];
      if (!pricing) throw new Error(`No pricing data for ${instrument}`);

      const bid = parseFloat(pricing.bids?.[0]?.price ?? '0');
      const ask = parseFloat(pricing.asks?.[0]?.price ?? '0');
      const last = (bid + ask) / 2;

      // Compute 24h stats from history
      const history = this.priceHistory.get(assetId) || [];
      const dayAgoPoint = history.length > 0 ? history[0] : null;
      const dayAgoClose = dayAgoPoint?.close ?? last;

      const price: CurrentPrice = {
        bid,
        ask,
        last,
        change24h: last - dayAgoClose,
        changePercent24h: ((last - dayAgoClose) / dayAgoClose) * 100,
        volume24h: history.reduce((sum, p) => sum + p.volume, 0),
        high24h: Math.max(...history.map(p => p.high), last),
        low24h: Math.min(...history.map(p => p.low), last),
        timestamp: Date.now(),
      };
      this.lastPrices.set(assetId, price);
      return price;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  }

  async getPriceHistory(assetId: string, periods: number): Promise<PricePoint[]> {
    const history = this.priceHistory.get(assetId) || [];
    return history.slice(-periods);
  }

  async placeOrder(params: ExchangeOrderParams): Promise<ExchangeOrderResult> {
    const instrument = INSTRUMENT_MAP[params.assetId];
    if (!instrument) {
      return { exchangeOrderId: '', status: 'rejected', filledQty: 0, avgFillPrice: 0, fee: 0, feeCurrency: 'USD' };
    }

    const units = params.side === 'buy'
      ? Math.round(params.quantity)
      : -Math.round(params.quantity);

    const orderBody: Record<string, unknown> = {
      order: {
        instrument,
        units: units.toString(),
        type: params.type === 'limit' ? 'LIMIT' : 'MARKET',
        timeInForce: params.type === 'limit' ? 'GTC' : 'FOK',
        ...(params.type === 'limit' && params.limitPrice ? { price: params.limitPrice.toString() } : {}),
      },
    };

    try {
      const res = await fetch(`${this.baseUrl}/accounts/${this.accountId}/orders`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(orderBody),
      });
      const data = await res.json();

      if (data.orderFillTransaction) {
        const fill = data.orderFillTransaction;
        return {
          exchangeOrderId: fill.id ?? fill.orderID ?? '',
          status: 'filled',
          filledQty: Math.abs(parseFloat(fill.units ?? '0')),
          avgFillPrice: parseFloat(fill.price ?? '0'),
          fee: Math.abs(parseFloat(fill.commission ?? '0')),
          feeCurrency: 'USD',
          rawResponse: data,
        };
      }

      if (data.orderCreateTransaction) {
        return {
          exchangeOrderId: data.orderCreateTransaction.id ?? '',
          status: 'open',
          filledQty: 0,
          avgFillPrice: 0,
          fee: 0,
          feeCurrency: 'USD',
          rawResponse: data,
        };
      }

      return {
        exchangeOrderId: '',
        status: 'rejected',
        filledQty: 0,
        avgFillPrice: 0,
        fee: 0,
        feeCurrency: 'USD',
        rawResponse: data,
      };
    } catch (err) {
      console.error('[OANDA] Order failed:', err);
      return { exchangeOrderId: '', status: 'rejected', filledQty: 0, avgFillPrice: 0, fee: 0, feeCurrency: 'USD' };
    }
  }

  async getOrderStatus(exchangeOrderId: string): Promise<ExchangeOrderStatus> {
    try {
      const res = await fetch(
        `${this.baseUrl}/accounts/${this.accountId}/orders/${exchangeOrderId}`,
        { headers: this.headers() }
      );
      if (!res.ok) {
        // Order might have been filled — check transactions
        return { exchangeOrderId, status: 'filled', filledQty: 0, avgFillPrice: 0, fee: 0 };
      }
      const data = await res.json();
      const order = data.order;
      if (!order) return { exchangeOrderId, status: 'filled', filledQty: 0, avgFillPrice: 0, fee: 0 };

      const state = order.state?.toLowerCase();
      if (state === 'filled') return { exchangeOrderId, status: 'filled', filledQty: Math.abs(parseFloat(order.filledUnits ?? '0')), avgFillPrice: parseFloat(order.price ?? '0'), fee: 0 };
      if (state === 'cancelled') return { exchangeOrderId, status: 'cancelled', filledQty: 0, avgFillPrice: 0, fee: 0 };
      return { exchangeOrderId, status: 'open', filledQty: 0, avgFillPrice: 0, fee: 0 };
    } catch {
      return { exchangeOrderId, status: 'open', filledQty: 0, avgFillPrice: 0, fee: 0 };
    }
  }

  async cancelOrder(exchangeOrderId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.baseUrl}/accounts/${this.accountId}/orders/${exchangeOrderId}/cancel`,
        { method: 'PUT', headers: this.headers() }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async tick(): Promise<Map<string, CurrentPrice>> {
    const updates = new Map<string, CurrentPrice>();
    const instruments = Object.values(INSTRUMENT_MAP).join(',');

    try {
      const res = await fetch(
        `${this.baseUrl}/accounts/${this.accountId}/pricing?instruments=${instruments}`,
        { headers: this.headers() }
      );
      if (!res.ok) throw new Error(`OANDA pricing failed: ${res.status}`);
      const data = await res.json();

      for (const pricing of data.prices || []) {
        const assetId = REVERSE_INSTRUMENT_MAP[pricing.instrument];
        if (!assetId) continue;

        const bid = parseFloat(pricing.bids?.[0]?.price ?? '0');
        const ask = parseFloat(pricing.asks?.[0]?.price ?? '0');
        const last = (bid + ask) / 2;

        const history = this.priceHistory.get(assetId) || [];
        const dayAgoPoint = history.length > 0 ? history[0] : null;
        const dayAgoClose = dayAgoPoint?.close ?? last;

        const price: CurrentPrice = {
          bid,
          ask,
          last,
          change24h: last - dayAgoClose,
          changePercent24h: ((last - dayAgoClose) / dayAgoClose) * 100,
          volume24h: history.reduce((sum, p) => sum + p.volume, 0),
          high24h: history.length > 0 ? Math.max(...history.map(p => p.high), last) : last,
          low24h: history.length > 0 ? Math.min(...history.map(p => p.low), last) : last,
          timestamp: Date.now(),
        };
        this.lastPrices.set(assetId, price);
        updates.set(assetId, price);

        // Append to price history
        const lastPoint = history[history.length - 1];
        if (!lastPoint || Date.now() - lastPoint.timestamp > 60000) {
          history.push({
            timestamp: Date.now(),
            open: lastPoint?.close ?? last,
            high: last,
            low: last,
            close: last,
            volume: 0,
          });
          if (history.length > 500) history.shift();
          this.priceHistory.set(assetId, history);
        }
      }
    } catch (err) {
      console.error('[OANDA] tick error:', err);
      for (const [assetId, price] of this.lastPrices) {
        updates.set(assetId, price);
      }
    }
    return updates;
  }
}
