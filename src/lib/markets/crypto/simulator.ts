import { MarketDataProvider, CurrentPrice, PricePoint } from '@/types/market';
import { CryptoAsset } from './types';
import { CRYPTO_ASSETS, CRYPTO_INITIAL_PRICES, CRYPTO_VOLATILITY } from './seeds';

export class CryptoSimulator implements MarketDataProvider<CryptoAsset> {
  marketType = 'crypto' as const;
  private prices: Map<string, number> = new Map();
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private dailyOpenPrices: Map<string, number> = new Map();
  private high24h: Map<string, number> = new Map();
  private low24h: Map<string, number> = new Map();
  private volumes: Map<string, number> = new Map();

  constructor() {
    for (const asset of CRYPTO_ASSETS) {
      const price = CRYPTO_INITIAL_PRICES[asset.id];
      this.prices.set(asset.id, price);
      this.dailyOpenPrices.set(asset.id, price);
      this.high24h.set(asset.id, price * 1.01);
      this.low24h.set(asset.id, price * 0.99);
      this.volumes.set(asset.id, Math.random() * 1_000_000_000 + 500_000_000);
      this.priceHistory.set(asset.id, this.generateInitialHistory(price, asset.id));
    }
  }

  private generateInitialHistory(currentPrice: number, assetId: string): PricePoint[] {
    const history: PricePoint[] = [];
    const volatility = CRYPTO_VOLATILITY[assetId] || 0.02;
    let price = currentPrice * (1 - volatility * 10);
    const now = Date.now();

    for (let i = 100; i >= 0; i--) {
      const change = (Math.random() - 0.48) * volatility * price;
      price += change;
      price = Math.max(price * 0.5, price);
      const high = price * (1 + Math.random() * volatility);
      const low = price * (1 - Math.random() * volatility);
      history.push({
        timestamp: now - i * 60000,
        open: price - change * 0.5,
        high,
        low,
        close: price,
        volume: Math.random() * 100_000_000 + 10_000_000,
      });
    }
    return history;
  }

  getAssets(): CryptoAsset[] {
    return CRYPTO_ASSETS;
  }

  getAsset(id: string): CryptoAsset | undefined {
    return CRYPTO_ASSETS.find(a => a.id === id);
  }

  getCurrentPrice(assetId: string): CurrentPrice {
    const last = this.prices.get(assetId) || 0;
    const spread = last * 0.001;
    const openPrice = this.dailyOpenPrices.get(assetId) || last;
    return {
      bid: last - spread / 2,
      ask: last + spread / 2,
      last,
      change24h: last - openPrice,
      changePercent24h: ((last - openPrice) / openPrice) * 100,
      volume24h: this.volumes.get(assetId) || 0,
      high24h: this.high24h.get(assetId) || last,
      low24h: this.low24h.get(assetId) || last,
      timestamp: Date.now(),
    };
  }

  getPriceHistory(assetId: string, periods: number): PricePoint[] {
    const history = this.priceHistory.get(assetId) || [];
    return history.slice(-periods);
  }

  tick(): Map<string, CurrentPrice> {
    const updates = new Map<string, CurrentPrice>();
    for (const asset of CRYPTO_ASSETS) {
      const currentPrice = this.prices.get(asset.id) || CRYPTO_INITIAL_PRICES[asset.id];
      const volatility = CRYPTO_VOLATILITY[asset.id] || 0.02;
      const drift = 0.0001;
      const randomShock = (Math.random() - 0.5) * 2;
      const change = currentPrice * (drift + volatility * randomShock * Math.sqrt(1 / 86400));
      const newPrice = Math.max(currentPrice * 0.01, currentPrice + change);

      this.prices.set(asset.id, newPrice);

      const high = this.high24h.get(asset.id) || newPrice;
      const low = this.low24h.get(asset.id) || newPrice;
      if (newPrice > high) this.high24h.set(asset.id, newPrice);
      if (newPrice < low) this.low24h.set(asset.id, newPrice);

      this.volumes.set(asset.id, (this.volumes.get(asset.id) || 0) + Math.random() * 1_000_000);

      const history = this.priceHistory.get(asset.id) || [];
      const lastPoint = history[history.length - 1];
      if (lastPoint && Date.now() - lastPoint.timestamp > 60000) {
        history.push({
          timestamp: Date.now(),
          open: lastPoint.close,
          high: Math.max(lastPoint.close, newPrice),
          low: Math.min(lastPoint.close, newPrice),
          close: newPrice,
          volume: Math.random() * 10_000_000,
        });
        if (history.length > 500) history.shift();
        this.priceHistory.set(asset.id, history);
      }

      updates.set(asset.id, this.getCurrentPrice(asset.id));
    }
    return updates;
  }
}
