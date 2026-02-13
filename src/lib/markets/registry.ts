import { MarketType, MarketDataProvider } from '@/types/market';
import { CryptoSimulator } from './crypto/simulator';
import { ForexSimulator } from './forex/simulator';
import { KalshiSimulator } from './kalshi/simulator';
import { PolymarketSimulator } from './polymarket/simulator';
import { SportsSimulator } from './sports/simulator';

class MarketRegistry {
  private simulators: Map<MarketType, MarketDataProvider> = new Map();

  constructor() {
    this.simulators.set('crypto', new CryptoSimulator());
    this.simulators.set('forex', new ForexSimulator());
    this.simulators.set('kalshi', new KalshiSimulator());
    this.simulators.set('polymarket', new PolymarketSimulator());
    this.simulators.set('sports', new SportsSimulator());
  }

  getProvider(marketType: MarketType): MarketDataProvider {
    const provider = this.simulators.get(marketType);
    if (!provider) throw new Error(`Unknown market type: ${marketType}`);
    return provider;
  }

  getAllProviders(): Map<MarketType, MarketDataProvider> {
    return this.simulators;
  }

  tickAll(): Map<MarketType, Map<string, import('@/types/market').CurrentPrice>> {
    const allUpdates = new Map<MarketType, Map<string, import('@/types/market').CurrentPrice>>();
    for (const [type, provider] of this.simulators) {
      allUpdates.set(type, provider.tick());
    }
    return allUpdates;
  }
}

// Singleton instance for server-side use
export const marketRegistry = new MarketRegistry();
