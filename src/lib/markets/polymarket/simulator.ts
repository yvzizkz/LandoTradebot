import { MarketDataProvider, CurrentPrice, PricePoint } from '@/types/market';
import { PolymarketContract } from './types';
import { POLYMARKET_CONTRACTS, POLYMARKET_VOLATILITY } from './seeds';

export class PolymarketSimulator implements MarketDataProvider<PolymarketContract> {
  marketType = 'polymarket' as const;
  private contracts: PolymarketContract[];
  private priceHistory: Map<string, PricePoint[]> = new Map();

  constructor() {
    this.contracts = POLYMARKET_CONTRACTS.map(c => ({
      ...c,
      outcomes: c.outcomes.map(o => ({ ...o })),
    }));
    for (const contract of this.contracts) {
      const mainOutcome = contract.outcomes[0];
      this.priceHistory.set(contract.id, this.generateInitialHistory(mainOutcome.price, contract.id));
    }
  }

  private generateInitialHistory(currentPrice: number, contractId: string): PricePoint[] {
    const history: PricePoint[] = [];
    const volatility = POLYMARKET_VOLATILITY[contractId] || 0.01;
    let price = currentPrice;
    const now = Date.now();
    for (let i = 100; i >= 0; i--) {
      const change = (Math.random() - 0.5) * volatility;
      price = Math.max(0.01, Math.min(0.99, price + change));
      history.push({
        timestamp: now - i * 60000,
        open: price - change * 0.3, high: Math.min(0.99, price + Math.abs(change)),
        low: Math.max(0.01, price - Math.abs(change)), close: price,
        volume: Math.random() * 100000,
      });
    }
    return history;
  }

  getAssets(): PolymarketContract[] { return this.contracts; }
  getAsset(id: string): PolymarketContract | undefined { return this.contracts.find(c => c.id === id); }

  getCurrentPrice(assetId: string): CurrentPrice {
    const contract = this.contracts.find(c => c.id === assetId);
    if (!contract) return { bid: 0, ask: 0, last: 0, change24h: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, timestamp: Date.now() };
    const mainPrice = contract.outcomes[0].price;
    return {
      bid: Math.max(0.01, mainPrice - 0.01), ask: Math.min(0.99, mainPrice + 0.01), last: mainPrice,
      change24h: 0, changePercent24h: 0,
      volume24h: contract.totalVolume,
      high24h: Math.min(0.99, mainPrice + 0.03), low24h: Math.max(0.01, mainPrice - 0.03),
      timestamp: Date.now(),
    };
  }

  getPriceHistory(assetId: string, periods: number): PricePoint[] {
    return (this.priceHistory.get(assetId) || []).slice(-periods);
  }

  tick(): Map<string, CurrentPrice> {
    const updates = new Map<string, CurrentPrice>();
    for (const contract of this.contracts) {
      if (contract.resolved) continue;
      const volatility = POLYMARKET_VOLATILITY[contract.id] || 0.01;
      const outcomes = contract.outcomes;
      for (let i = 0; i < outcomes.length - 1; i++) {
        const change = (Math.random() - 0.5) * volatility;
        outcomes[i].price = Math.max(0.01, Math.min(0.99, outcomes[i].price + change));
      }
      // Normalize so prices sum to ~1
      const total = outcomes.reduce((s, o) => s + o.price, 0);
      for (const o of outcomes) { o.price = o.price / total; }

      contract.totalVolume += Math.floor(Math.random() * 10000);

      const history = this.priceHistory.get(contract.id) || [];
      const lastPoint = history[history.length - 1];
      if (lastPoint && Date.now() - lastPoint.timestamp > 60000) {
        history.push({
          timestamp: Date.now(), open: lastPoint.close,
          high: Math.max(lastPoint.close, outcomes[0].price),
          low: Math.min(lastPoint.close, outcomes[0].price),
          close: outcomes[0].price, volume: Math.random() * 50000,
        });
        if (history.length > 500) history.shift();
      }
      updates.set(contract.id, this.getCurrentPrice(contract.id));
    }
    return updates;
  }
}
