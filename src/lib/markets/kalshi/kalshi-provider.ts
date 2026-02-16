import {
  CurrentPrice,
  PricePoint,
  ExchangeProvider,
  ExchangeOrderParams,
  ExchangeOrderResult,
  ExchangeOrderStatus,
} from '@/types/market';
import { KalshiContract } from './types';
import { KALSHI_CONTRACTS } from './seeds';

export class KalshiProvider implements ExchangeProvider<KalshiContract> {
  marketType = 'kalshi' as const;
  exchangeId = 'kalshi';
  isSimulator = false;

  private baseUrl: string;
  private email: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private markets: KalshiContract[] = [];
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private lastPrices: Map<string, CurrentPrice> = new Map();

  constructor(config: { email: string; password: string; demo: boolean }) {
    this.email = config.email;
    this.password = config.password;
    this.baseUrl = config.demo
      ? 'https://demo-api.kalshi.co/trade-api/v2'
      : 'https://trading-api.kalshi.com/trade-api/v2';
  }

  private async ensureAuth(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) return;

    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!res.ok) {
      throw new Error(`Kalshi auth failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    this.token = data.token;
    // Token lasts ~24h, refresh after 23h
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async initialize(): Promise<void> {
    await this.ensureAuth();

    // Fetch available markets
    try {
      const res = await fetch(`${this.baseUrl}/markets?limit=50&status=open`, {
        headers: this.headers(),
      });
      if (res.ok) {
        const data = await res.json();
        const apiMarkets = data.markets || [];

        // Map Kalshi API markets to our KalshiContract type
        this.markets = apiMarkets.slice(0, 20).map((m: {
          ticker: string;
          title: string;
          subtitle: string;
          category: string;
          close_time: string;
          yes_bid: number;
          no_bid: number;
          volume: number;
          open_interest: number;
          status: string;
        }) => ({
          id: m.ticker.toLowerCase(),
          symbol: m.ticker,
          name: m.title,
          marketType: 'kalshi' as const,
          eventTitle: m.subtitle || m.title,
          category: m.category || 'General',
          expirationDate: m.close_time || '',
          yesPrice: m.yes_bid || 50,
          noPrice: m.no_bid || 50,
          volume: m.volume || 0,
          openInterest: m.open_interest || 0,
          status: 'open' as const,
        }));
      }
    } catch (err) {
      console.warn('[Kalshi] Failed to fetch markets, using seed data:', err);
    }

    // Fallback to seed data if no markets loaded
    if (this.markets.length === 0) {
      this.markets = [...KALSHI_CONTRACTS];
    }

    await this.tick();
    console.log(`[Kalshi] Provider initialized with ${this.markets.length} markets`);
  }

  async destroy(): Promise<void> {}

  async getAssets(): Promise<KalshiContract[]> {
    return this.markets;
  }

  async getAsset(id: string): Promise<KalshiContract | undefined> {
    return this.markets.find(m => m.id === id);
  }

  async getCurrentPrice(assetId: string): Promise<CurrentPrice> {
    const cached = this.lastPrices.get(assetId);
    if (cached && Date.now() - cached.timestamp < 5000) return cached;

    const contract = this.markets.find(m => m.id === assetId);
    if (!contract) throw new Error(`Unknown asset: ${assetId}`);

    try {
      await this.ensureAuth();
      const res = await fetch(`${this.baseUrl}/markets/${contract.symbol}`, {
        headers: this.headers(),
      });
      if (res.ok) {
        const data = await res.json();
        const market = data.market;
        if (market) {
          const yesPrice = (market.yes_bid || contract.yesPrice) / 100;
          const noPrice = (market.no_bid || contract.noPrice) / 100;

          const history = this.priceHistory.get(assetId) || [];
          const dayAgoPoint = history.length > 0 ? history[0] : null;
          const dayAgoClose = dayAgoPoint?.close ?? yesPrice;

          const price: CurrentPrice = {
            bid: yesPrice,
            ask: (market.yes_ask || yesPrice * 100 + 1) / 100,
            last: yesPrice,
            change24h: yesPrice - dayAgoClose,
            changePercent24h: dayAgoClose > 0 ? ((yesPrice - dayAgoClose) / dayAgoClose) * 100 : 0,
            volume24h: market.volume || contract.volume,
            high24h: yesPrice,
            low24h: yesPrice,
            timestamp: Date.now(),
          };
          this.lastPrices.set(assetId, price);

          // Update contract data
          contract.yesPrice = market.yes_bid || contract.yesPrice;
          contract.noPrice = market.no_bid || contract.noPrice;
          contract.volume = market.volume || contract.volume;

          return price;
        }
      }
    } catch (err) {
      if (cached) return cached;
      console.error(`[Kalshi] Price fetch failed for ${assetId}:`, err);
    }

    // Fallback to contract seed data
    if (cached) return cached;
    const yesPrice = contract.yesPrice / 100;
    return {
      bid: yesPrice,
      ask: yesPrice + 0.01,
      last: yesPrice,
      change24h: 0,
      changePercent24h: 0,
      volume24h: contract.volume,
      high24h: yesPrice,
      low24h: yesPrice,
      timestamp: Date.now(),
    };
  }

  async getPriceHistory(assetId: string, periods: number): Promise<PricePoint[]> {
    const history = this.priceHistory.get(assetId) || [];
    return history.slice(-periods);
  }

  async placeOrder(params: ExchangeOrderParams): Promise<ExchangeOrderResult> {
    const contract = this.markets.find(m => m.id === params.assetId);
    if (!contract) {
      return { exchangeOrderId: '', status: 'rejected', filledQty: 0, avgFillPrice: 0, fee: 0, feeCurrency: 'USD' };
    }

    try {
      await this.ensureAuth();
      const orderBody = {
        ticker: contract.symbol,
        action: params.side === 'buy' ? 'buy' : 'sell',
        side: 'yes', // Default to yes contracts
        type: params.type,
        count: Math.round(params.quantity),
        ...(params.type === 'limit' && params.limitPrice ? { yes_price: Math.round(params.limitPrice * 100) } : {}),
      };

      const res = await fetch(`${this.baseUrl}/portfolio/orders`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(orderBody),
      });
      const data = await res.json();

      if (data.order) {
        const order = data.order;
        const status = order.status === 'resting' ? 'open' : order.status === 'executed' ? 'filled' : 'rejected';
        return {
          exchangeOrderId: order.order_id || '',
          status: status as 'filled' | 'open' | 'rejected',
          filledQty: order.count || 0,
          avgFillPrice: (order.yes_price || 0) / 100,
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
      console.error('[Kalshi] Order failed:', err);
      return { exchangeOrderId: '', status: 'rejected', filledQty: 0, avgFillPrice: 0, fee: 0, feeCurrency: 'USD' };
    }
  }

  async getOrderStatus(exchangeOrderId: string): Promise<ExchangeOrderStatus> {
    try {
      await this.ensureAuth();
      const res = await fetch(`${this.baseUrl}/portfolio/orders/${exchangeOrderId}`, {
        headers: this.headers(),
      });
      if (!res.ok) return { exchangeOrderId, status: 'open', filledQty: 0, avgFillPrice: 0, fee: 0 };
      const data = await res.json();
      const order = data.order;
      if (!order) return { exchangeOrderId, status: 'open', filledQty: 0, avgFillPrice: 0, fee: 0 };

      const statusMap: Record<string, ExchangeOrderStatus['status']> = {
        resting: 'open',
        executed: 'filled',
        canceled: 'cancelled',
      };

      return {
        exchangeOrderId,
        status: statusMap[order.status] ?? 'open',
        filledQty: order.count || 0,
        avgFillPrice: (order.yes_price || 0) / 100,
        fee: 0,
      };
    } catch {
      return { exchangeOrderId, status: 'open', filledQty: 0, avgFillPrice: 0, fee: 0 };
    }
  }

  async cancelOrder(exchangeOrderId: string): Promise<boolean> {
    try {
      await this.ensureAuth();
      const res = await fetch(`${this.baseUrl}/portfolio/orders/${exchangeOrderId}`, {
        method: 'DELETE',
        headers: this.headers(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async tick(): Promise<Map<string, CurrentPrice>> {
    const updates = new Map<string, CurrentPrice>();

    for (const contract of this.markets) {
      try {
        const price = await this.getCurrentPrice(contract.id);
        updates.set(contract.id, price);

        // Append to price history
        const history = this.priceHistory.get(contract.id) || [];
        const lastPoint = history[history.length - 1];
        if (!lastPoint || Date.now() - lastPoint.timestamp > 60000) {
          history.push({
            timestamp: Date.now(),
            open: lastPoint?.close ?? price.last,
            high: price.last,
            low: price.last,
            close: price.last,
            volume: price.volume24h,
          });
          if (history.length > 500) history.shift();
          this.priceHistory.set(contract.id, history);
        }
      } catch (err) {
        const cached = this.lastPrices.get(contract.id);
        if (cached) updates.set(contract.id, cached);
      }
    }

    return updates;
  }
}
