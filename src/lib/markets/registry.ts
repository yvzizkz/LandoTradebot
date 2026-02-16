import { MarketType, ExchangeProvider, CurrentPrice } from '@/types/market';
import { MARKET_TYPES } from '@/types/market';
import { CryptoSimulator } from './crypto/simulator';
import { ForexSimulator } from './forex/simulator';
import { KalshiSimulator } from './kalshi/simulator';
import { PolymarketSimulator } from './polymarket/simulator';
import { SportsSimulator } from './sports/simulator';
import { SimulatorAdapter } from './simulator-adapter';
import {
  getCryptoProvider,
  getForexProvider,
  getKalshiProvider,
  getExchangeCredentials,
  logProviderConfig,
} from '@/lib/config';

class MarketRegistry {
  private providers: Map<MarketType, ExchangeProvider> = new Map();
  private initialized = false;
  private initializing: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = this._doInit();
    await this.initializing;
    this.initialized = true;
  }

  private async _doInit(): Promise<void> {
    logProviderConfig();
    const creds = getExchangeCredentials();

    // Crypto provider
    const cryptoChoice = getCryptoProvider();
    if (cryptoChoice === 'binance' && creds.binance) {
      try {
        const { BinanceProvider } = await import('./crypto/binance-provider');
        const provider = new BinanceProvider(creds.binance);
        await provider.initialize();
        this.providers.set('crypto', provider);
        console.log('[Registry] Crypto: Binance connected');
      } catch (err) {
        console.warn('[Registry] Binance init failed, falling back to simulator:', err);
        this.providers.set('crypto', new SimulatorAdapter(new CryptoSimulator()));
      }
    } else if (cryptoChoice === 'coinbase' && creds.coinbase) {
      try {
        const { CoinbaseProvider } = await import('./crypto/coinbase-provider');
        const provider = new CoinbaseProvider(creds.coinbase);
        await provider.initialize();
        this.providers.set('crypto', provider);
        console.log('[Registry] Crypto: Coinbase connected');
      } catch (err) {
        console.warn('[Registry] Coinbase init failed, falling back to simulator:', err);
        this.providers.set('crypto', new SimulatorAdapter(new CryptoSimulator()));
      }
    } else {
      this.providers.set('crypto', new SimulatorAdapter(new CryptoSimulator()));
      console.log('[Registry] Crypto: Simulator');
    }

    // Forex provider
    const forexChoice = getForexProvider();
    if (forexChoice === 'oanda' && creds.oanda) {
      try {
        const { OandaProvider } = await import('./forex/oanda-provider');
        const provider = new OandaProvider(creds.oanda);
        await provider.initialize();
        this.providers.set('forex', provider);
        console.log('[Registry] Forex: OANDA connected');
      } catch (err) {
        console.warn('[Registry] OANDA init failed, falling back to simulator:', err);
        this.providers.set('forex', new SimulatorAdapter(new ForexSimulator()));
      }
    } else {
      this.providers.set('forex', new SimulatorAdapter(new ForexSimulator()));
      console.log('[Registry] Forex: Simulator');
    }

    // Kalshi provider
    const kalshiChoice = getKalshiProvider();
    if (kalshiChoice === 'kalshi' && creds.kalshi) {
      try {
        const { KalshiProvider } = await import('./kalshi/kalshi-provider');
        const provider = new KalshiProvider(creds.kalshi);
        await provider.initialize();
        this.providers.set('kalshi', provider);
        console.log('[Registry] Kalshi: Connected');
      } catch (err) {
        console.warn('[Registry] Kalshi init failed, falling back to simulator:', err);
        this.providers.set('kalshi', new SimulatorAdapter(new KalshiSimulator()));
      }
    } else {
      this.providers.set('kalshi', new SimulatorAdapter(new KalshiSimulator()));
      console.log('[Registry] Kalshi: Simulator');
    }

    // Polymarket + Sports always use simulator
    this.providers.set('polymarket', new SimulatorAdapter(new PolymarketSimulator()));
    this.providers.set('sports', new SimulatorAdapter(new SportsSimulator()));
    console.log('[Registry] Polymarket: Simulator');
    console.log('[Registry] Sports: Simulator');
  }

  getProvider(marketType: MarketType): ExchangeProvider {
    const provider = this.providers.get(marketType);
    if (!provider) throw new Error(`Market provider not initialized for: ${marketType}`);
    return provider;
  }

  getAllProviders(): Map<MarketType, ExchangeProvider> {
    return this.providers;
  }

  async tickAll(): Promise<Map<MarketType, Map<string, CurrentPrice>>> {
    const allUpdates = new Map<MarketType, Map<string, CurrentPrice>>();
    const tickPromises = MARKET_TYPES.map(async (type) => {
      const provider = this.providers.get(type);
      if (provider) {
        const prices = await provider.tick();
        allUpdates.set(type, prices);
      }
    });
    await Promise.all(tickPromises);
    return allUpdates;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getProviderInfo(): Record<string, { exchangeId: string; isSimulator: boolean }> {
    const info: Record<string, { exchangeId: string; isSimulator: boolean }> = {};
    for (const [type, provider] of this.providers) {
      info[type] = { exchangeId: provider.exchangeId, isSimulator: provider.isSimulator };
    }
    return info;
  }
}

export const marketRegistry = new MarketRegistry();
