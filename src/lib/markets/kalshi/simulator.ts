import { MarketDataProvider, CurrentPrice, PricePoint } from '@/types/market';
import { KalshiContract } from './types';
import { KALSHI_CONTRACTS, KALSHI_VOLATILITY } from './seeds';

export class KalshiSimulator implements MarketDataProvider<KalshiContract> {
  marketType = 'kalshi' as const;
  private contracts: KalshiContract[];
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private volumes: Map<string, number> = new Map();

  constructor() {
    this.contracts = KALSHI_CONTRACTS.map(c => ({ ...c }));
    for (const contract of this.contracts) {
      this.volumes.set(contract.id, contract.volume);
      this.priceHistory.set(contract.id, this.generateInitialHistory(contract.yesPrice, contract.id));
    }
  }

  private generateInitialHistory(currentPrice: number, contractId: string): PricePoint[] {
    const history: PricePoint[] = [];
    const volatility = KALSHI_VOLATILITY[contractId] || 0.02;
    let price = currentPrice;
    const now = Date.now();
    for (let i = 100; i >= 0; i--) {
      const change = (Math.random() - 0.5) * volatility * 100;
      price = Math.max(1, Math.min(99, price + change));
      history.push({
        timestamp: now - i * 60000,
        open: price - change * 0.3, high: Math.min(99, price + Math.abs(change)),
        low: Math.max(1, price - Math.abs(change)), close: price,
        volume: Math.random() * 5000,
      });
    }
    return history;
  }

  getAssets(): KalshiContract[] { return this.contracts; }
  getAsset(id: string): KalshiContract | undefined { return this.contracts.find(c => c.id === id); }

  getCurrentPrice(assetId: string): CurrentPrice {
    const contract = this.contracts.find(c => c.id === assetId);
    if (!contract) return { bid: 0, ask: 0, last: 0, change24h: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, timestamp: Date.now() };
    const last = contract.yesPrice;
    return {
      bid: Math.max(1, last - 1), ask: Math.min(99, last + 1), last,
      change24h: 0, changePercent24h: 0,
      volume24h: this.volumes.get(assetId) || 0,
      high24h: Math.min(99, last + 3), low24h: Math.max(1, last - 3),
      timestamp: Date.now(),
    };
  }

  getPriceHistory(assetId: string, periods: number): PricePoint[] {
    return (this.priceHistory.get(assetId) || []).slice(-periods);
  }

  tick(): Map<string, CurrentPrice> {
    const updates = new Map<string, CurrentPrice>();
    for (const contract of this.contracts) {
      if (contract.status !== 'open') continue;
      const volatility = KALSHI_VOLATILITY[contract.id] || 0.02;
      const change = (Math.random() - 0.5) * volatility * 100;
      contract.yesPrice = Math.max(1, Math.min(99, Math.round(contract.yesPrice + change)));
      contract.noPrice = 100 - contract.yesPrice;
      this.volumes.set(contract.id, (this.volumes.get(contract.id) || 0) + Math.floor(Math.random() * 100));
      const history = this.priceHistory.get(contract.id) || [];
      const lastPoint = history[history.length - 1];
      if (lastPoint && Date.now() - lastPoint.timestamp > 60000) {
        history.push({
          timestamp: Date.now(), open: lastPoint.close,
          high: Math.max(lastPoint.close, contract.yesPrice),
          low: Math.min(lastPoint.close, contract.yesPrice),
          close: contract.yesPrice, volume: Math.random() * 1000,
        });
        if (history.length > 500) history.shift();
      }
      updates.set(contract.id, this.getCurrentPrice(contract.id));
    }
    return updates;
  }
}
