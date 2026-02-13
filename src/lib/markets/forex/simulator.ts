import { MarketDataProvider, CurrentPrice, PricePoint } from '@/types/market';
import { ForexPair } from './types';
import { FOREX_PAIRS, FOREX_INITIAL_PRICES, FOREX_VOLATILITY } from './seeds';

export class ForexSimulator implements MarketDataProvider<ForexPair> {
  marketType = 'forex' as const;
  private prices: Map<string, number> = new Map();
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private dailyOpenPrices: Map<string, number> = new Map();
  private high24h: Map<string, number> = new Map();
  private low24h: Map<string, number> = new Map();
  private volumes: Map<string, number> = new Map();

  constructor() {
    for (const pair of FOREX_PAIRS) {
      const price = FOREX_INITIAL_PRICES[pair.id];
      this.prices.set(pair.id, price);
      this.dailyOpenPrices.set(pair.id, price);
      this.high24h.set(pair.id, price * 1.002);
      this.low24h.set(pair.id, price * 0.998);
      this.volumes.set(pair.id, Math.random() * 5_000_000_000 + 1_000_000_000);
      this.priceHistory.set(pair.id, this.generateInitialHistory(price, pair.id));
    }
  }

  private generateInitialHistory(currentPrice: number, pairId: string): PricePoint[] {
    const history: PricePoint[] = [];
    const volatility = FOREX_VOLATILITY[pairId] || 0.003;
    let price = currentPrice * (1 - volatility * 5);
    const now = Date.now();
    for (let i = 100; i >= 0; i--) {
      const change = (Math.random() - 0.48) * volatility * price;
      price += change;
      const high = price * (1 + Math.random() * volatility * 0.5);
      const low = price * (1 - Math.random() * volatility * 0.5);
      history.push({
        timestamp: now - i * 60000,
        open: price - change * 0.5,
        high, low, close: price,
        volume: Math.random() * 500_000_000,
      });
    }
    return history;
  }

  getAssets(): ForexPair[] { return FOREX_PAIRS; }
  getAsset(id: string): ForexPair | undefined { return FOREX_PAIRS.find(p => p.id === id); }

  getCurrentPrice(assetId: string): CurrentPrice {
    const last = this.prices.get(assetId) || 0;
    const pair = FOREX_PAIRS.find(p => p.id === assetId);
    const spread = (pair?.pipSize || 0.0001) * (Math.random() * 2 + 1);
    const openPrice = this.dailyOpenPrices.get(assetId) || last;
    return {
      bid: last - spread / 2, ask: last + spread / 2, last,
      change24h: last - openPrice,
      changePercent24h: ((last - openPrice) / openPrice) * 100,
      volume24h: this.volumes.get(assetId) || 0,
      high24h: this.high24h.get(assetId) || last,
      low24h: this.low24h.get(assetId) || last,
      timestamp: Date.now(),
    };
  }

  getPriceHistory(assetId: string, periods: number): PricePoint[] {
    return (this.priceHistory.get(assetId) || []).slice(-periods);
  }

  tick(): Map<string, CurrentPrice> {
    const updates = new Map<string, CurrentPrice>();
    for (const pair of FOREX_PAIRS) {
      const currentPrice = this.prices.get(pair.id) || FOREX_INITIAL_PRICES[pair.id];
      const volatility = FOREX_VOLATILITY[pair.id] || 0.003;
      const randomShock = (Math.random() - 0.5) * 2;
      const change = currentPrice * volatility * randomShock * Math.sqrt(1 / 86400);
      const newPrice = currentPrice + change;
      this.prices.set(pair.id, newPrice);
      const high = this.high24h.get(pair.id) || newPrice;
      const low = this.low24h.get(pair.id) || newPrice;
      if (newPrice > high) this.high24h.set(pair.id, newPrice);
      if (newPrice < low) this.low24h.set(pair.id, newPrice);
      this.volumes.set(pair.id, (this.volumes.get(pair.id) || 0) + Math.random() * 10_000_000);
      const history = this.priceHistory.get(pair.id) || [];
      const lastPoint = history[history.length - 1];
      if (lastPoint && Date.now() - lastPoint.timestamp > 60000) {
        history.push({
          timestamp: Date.now(), open: lastPoint.close,
          high: Math.max(lastPoint.close, newPrice), low: Math.min(lastPoint.close, newPrice),
          close: newPrice, volume: Math.random() * 100_000_000,
        });
        if (history.length > 500) history.shift();
        this.priceHistory.set(pair.id, history);
      }
      updates.set(pair.id, this.getCurrentPrice(pair.id));
    }
    return updates;
  }
}
