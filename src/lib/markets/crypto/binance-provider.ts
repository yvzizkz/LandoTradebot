import { binance as BinanceExchange } from 'ccxt';
import {
  CurrentPrice,
  PricePoint,
  ExchangeProvider,
  ExchangeOrderParams,
  ExchangeOrderResult,
  ExchangeOrderStatus,
} from '@/types/market';
import { CryptoAsset } from './types';
import { CRYPTO_ASSETS } from './seeds';

// Maps our internal asset IDs to Binance trading symbols
const SYMBOL_MAP: Record<string, string> = {
  btc: 'BTC/USDT',
  eth: 'ETH/USDT',
  sol: 'SOL/USDT',
  bnb: 'BNB/USDT',
  xrp: 'XRP/USDT',
  ada: 'ADA/USDT',
};

const REVERSE_SYMBOL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_MAP).map(([k, v]) => [v, k])
);

export class BinanceProvider implements ExchangeProvider<CryptoAsset> {
  marketType = 'crypto' as const;
  exchangeId = 'binance';
  isSimulator = false;

  private exchange: BinanceExchange;
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private lastPrices: Map<string, CurrentPrice> = new Map();

  constructor(config: { apiKey: string; secret: string; sandbox: boolean }) {
    this.exchange = new BinanceExchange({
      apiKey: config.apiKey,
      secret: config.secret,
      sandbox: config.sandbox,
      enableRateLimit: true,
    });
  }

  async initialize(): Promise<void> {
    await this.exchange.loadMarkets();
    // Fetch initial prices
    await this.tick();
    // Fetch initial OHLCV history for each asset
    const historyPromises = CRYPTO_ASSETS.map(async (asset) => {
      const symbol = SYMBOL_MAP[asset.id];
      if (!symbol || !this.exchange.markets[symbol]) return;
      try {
        const ohlcv = await this.exchange.fetchOHLCV(symbol, '1m', undefined, 100);
        const history: PricePoint[] = ohlcv.map((candle) => ({
          timestamp: candle[0] as number,
          open: candle[1] as number,
          high: candle[2] as number,
          low: candle[3] as number,
          close: candle[4] as number,
          volume: candle[5] as number,
        }));
        this.priceHistory.set(asset.id, history);
      } catch (err) {
        console.warn(`[Binance] Failed to fetch history for ${symbol}:`, err);
        this.priceHistory.set(asset.id, []);
      }
    });
    await Promise.all(historyPromises);
    console.log('[Binance] Provider initialized');
  }

  async destroy(): Promise<void> {
    // ccxt doesn't need explicit cleanup
  }

  async getAssets(): Promise<CryptoAsset[]> {
    return CRYPTO_ASSETS.filter(a => SYMBOL_MAP[a.id] && this.exchange.markets[SYMBOL_MAP[a.id]]);
  }

  async getAsset(id: string): Promise<CryptoAsset | undefined> {
    return CRYPTO_ASSETS.find(a => a.id === id);
  }

  async getCurrentPrice(assetId: string): Promise<CurrentPrice> {
    const cached = this.lastPrices.get(assetId);
    if (cached && Date.now() - cached.timestamp < 5000) return cached;

    const symbol = SYMBOL_MAP[assetId];
    if (!symbol) throw new Error(`Unknown asset: ${assetId}`);

    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      const price: CurrentPrice = {
        bid: ticker.bid ?? ticker.last ?? 0,
        ask: ticker.ask ?? ticker.last ?? 0,
        last: ticker.last ?? 0,
        change24h: ticker.change ?? 0,
        changePercent24h: ticker.percentage ?? 0,
        volume24h: ticker.baseVolume ?? 0,
        high24h: ticker.high ?? ticker.last ?? 0,
        low24h: ticker.low ?? ticker.last ?? 0,
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
    const symbol = SYMBOL_MAP[params.assetId];
    if (!symbol) {
      return { exchangeOrderId: '', status: 'rejected', filledQty: 0, avgFillPrice: 0, fee: 0, feeCurrency: 'USDT' };
    }

    try {
      const order = await this.exchange.createOrder(
        symbol,
        params.type,
        params.side,
        params.quantity,
        params.type === 'limit' ? params.limitPrice : undefined,
      );

      const fee = order.fee?.cost ?? 0;
      const feeCurrency = order.fee?.currency ?? 'USDT';

      if (order.status === 'closed') {
        return {
          exchangeOrderId: order.id,
          status: 'filled',
          filledQty: order.filled ?? params.quantity,
          avgFillPrice: order.average ?? order.price ?? 0,
          fee,
          feeCurrency,
          rawResponse: order,
        };
      }

      return {
        exchangeOrderId: order.id,
        status: order.status === 'canceled' ? 'rejected' : 'open',
        filledQty: order.filled ?? 0,
        avgFillPrice: order.average ?? 0,
        fee,
        feeCurrency,
        rawResponse: order,
      };
    } catch (err) {
      console.error('[Binance] Order failed:', err);
      return { exchangeOrderId: '', status: 'rejected', filledQty: 0, avgFillPrice: 0, fee: 0, feeCurrency: 'USDT' };
    }
  }

  async getOrderStatus(exchangeOrderId: string): Promise<ExchangeOrderStatus> {
    // We need the symbol to fetch order — search across all known symbols
    for (const symbol of Object.values(SYMBOL_MAP)) {
      try {
        const order = await this.exchange.fetchOrder(exchangeOrderId, symbol);
        const statusMap: Record<string, ExchangeOrderStatus['status']> = {
          open: 'open',
          closed: 'filled',
          canceled: 'cancelled',
        };
        return {
          exchangeOrderId: order.id,
          status: statusMap[order.status ?? 'open'] ?? 'open',
          filledQty: order.filled ?? 0,
          avgFillPrice: order.average ?? 0,
          fee: order.fee?.cost ?? 0,
        };
      } catch {
        continue;
      }
    }
    return { exchangeOrderId, status: 'open', filledQty: 0, avgFillPrice: 0, fee: 0 };
  }

  async cancelOrder(exchangeOrderId: string): Promise<boolean> {
    for (const symbol of Object.values(SYMBOL_MAP)) {
      try {
        await this.exchange.cancelOrder(exchangeOrderId, symbol);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  async tick(): Promise<Map<string, CurrentPrice>> {
    const updates = new Map<string, CurrentPrice>();
    try {
      // Batch fetch all tickers at once
      const tickers = await this.exchange.fetchTickers(Object.values(SYMBOL_MAP));
      for (const [symbol, ticker] of Object.entries(tickers)) {
        const assetId = REVERSE_SYMBOL_MAP[symbol];
        if (!assetId) continue;

        const price: CurrentPrice = {
          bid: ticker.bid ?? ticker.last ?? 0,
          ask: ticker.ask ?? ticker.last ?? 0,
          last: ticker.last ?? 0,
          change24h: ticker.change ?? 0,
          changePercent24h: ticker.percentage ?? 0,
          volume24h: ticker.baseVolume ?? 0,
          high24h: ticker.high ?? ticker.last ?? 0,
          low24h: ticker.low ?? ticker.last ?? 0,
          timestamp: Date.now(),
        };
        this.lastPrices.set(assetId, price);
        updates.set(assetId, price);

        // Append to price history
        const history = this.priceHistory.get(assetId) || [];
        const lastPoint = history[history.length - 1];
        if (!lastPoint || Date.now() - lastPoint.timestamp > 60000) {
          history.push({
            timestamp: Date.now(),
            open: lastPoint?.close ?? price.last,
            high: price.high24h,
            low: price.low24h,
            close: price.last,
            volume: price.volume24h,
          });
          if (history.length > 500) history.shift();
          this.priceHistory.set(assetId, history);
        }
      }
    } catch (err) {
      console.error('[Binance] tick error:', err);
      // Return cached prices on error
      for (const [assetId, price] of this.lastPrices) {
        updates.set(assetId, price);
      }
    }
    return updates;
  }
}
