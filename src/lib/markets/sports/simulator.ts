import { MarketDataProvider, CurrentPrice, PricePoint } from '@/types/market';
import { SportsEvent } from './types';
import { SPORTS_EVENTS, SPORTS_VOLATILITY } from './seeds';

export class SportsSimulator implements MarketDataProvider<SportsEvent> {
  marketType = 'sports' as const;
  private events: SportsEvent[];
  private priceHistory: Map<string, PricePoint[]> = new Map();

  constructor() {
    this.events = SPORTS_EVENTS.map(e => ({
      ...e,
      odds: {
        moneyline: { ...e.odds.moneyline },
        spread: { ...e.odds.spread },
        overUnder: { ...e.odds.overUnder },
      },
    }));
    for (const event of this.events) {
      const impliedProb = event.odds.moneyline.home < 0
        ? Math.abs(event.odds.moneyline.home) / (Math.abs(event.odds.moneyline.home) + 100)
        : 100 / (event.odds.moneyline.home + 100);
      this.priceHistory.set(event.id, this.generateInitialHistory(impliedProb, event.id));
    }
  }

  private generateInitialHistory(currentPrice: number, eventId: string): PricePoint[] {
    const history: PricePoint[] = [];
    const volatility = SPORTS_VOLATILITY[eventId] || 0.01;
    let price = currentPrice;
    const now = Date.now();
    for (let i = 100; i >= 0; i--) {
      const change = (Math.random() - 0.5) * volatility;
      price = Math.max(0.1, Math.min(0.9, price + change));
      history.push({
        timestamp: now - i * 60000,
        open: price, high: price + Math.abs(change), low: price - Math.abs(change),
        close: price, volume: Math.random() * 50000,
      });
    }
    return history;
  }

  getAssets(): SportsEvent[] { return this.events; }
  getAsset(id: string): SportsEvent | undefined { return this.events.find(e => e.id === id); }

  getCurrentPrice(assetId: string): CurrentPrice {
    const event = this.events.find(e => e.id === assetId);
    if (!event) return { bid: 0, ask: 0, last: 0, change24h: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, timestamp: Date.now() };
    const ml = event.odds.moneyline.home;
    const impliedProb = ml < 0 ? Math.abs(ml) / (Math.abs(ml) + 100) : 100 / (ml + 100);
    return {
      bid: impliedProb - 0.02, ask: impliedProb + 0.02, last: impliedProb,
      change24h: 0, changePercent24h: 0,
      volume24h: 50000, high24h: impliedProb + 0.05, low24h: impliedProb - 0.05,
      timestamp: Date.now(),
    };
  }

  getPriceHistory(assetId: string, periods: number): PricePoint[] {
    return (this.priceHistory.get(assetId) || []).slice(-periods);
  }

  tick(): Map<string, CurrentPrice> {
    const updates = new Map<string, CurrentPrice>();
    for (const event of this.events) {
      if (event.status === 'final') continue;
      const volatility = SPORTS_VOLATILITY[event.id] || 0.01;
      // Drift moneyline odds
      const mlChange = (Math.random() - 0.5) * volatility * 20;
      event.odds.moneyline.home += mlChange;
      event.odds.moneyline.away -= mlChange * 0.8;
      // Drift over/under line slightly
      event.odds.overUnder.line += (Math.random() - 0.5) * 0.1;

      const history = this.priceHistory.get(event.id) || [];
      const lastPoint = history[history.length - 1];
      const ml = event.odds.moneyline.home;
      const impliedProb = ml < 0 ? Math.abs(ml) / (Math.abs(ml) + 100) : 100 / (ml + 100);
      if (lastPoint && Date.now() - lastPoint.timestamp > 60000) {
        history.push({
          timestamp: Date.now(), open: lastPoint.close,
          high: Math.max(lastPoint.close, impliedProb),
          low: Math.min(lastPoint.close, impliedProb),
          close: impliedProb, volume: Math.random() * 10000,
        });
        if (history.length > 500) history.shift();
      }
      updates.set(event.id, this.getCurrentPrice(event.id));
    }
    return updates;
  }
}
