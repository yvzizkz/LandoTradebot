import { marketRegistry } from '@/lib/markets/registry';
import { MarketType, CurrentPrice, MARKET_TYPES } from '@/types/market';

export interface StreamUpdate {
  marketType: MarketType;
  prices: Record<string, CurrentPrice>;
  timestamp: number;
}

class MarketStream {
  private listeners: Set<(update: StreamUpdate[]) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start(intervalMs: number = 1500): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
    // Initial tick
    this.tick();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private tick(): void {
    const allUpdates = marketRegistry.tickAll();
    const streamUpdates: StreamUpdate[] = [];

    for (const [marketType, prices] of allUpdates) {
      const priceRecord: Record<string, CurrentPrice> = {};
      for (const [assetId, price] of prices) {
        priceRecord[assetId] = price;
      }
      streamUpdates.push({
        marketType,
        prices: priceRecord,
        timestamp: Date.now(),
      });
    }

    for (const listener of this.listeners) {
      try {
        listener(streamUpdates);
      } catch {
        // Remove broken listeners
        this.listeners.delete(listener);
      }
    }
  }

  subscribe(listener: (update: StreamUpdate[]) => void): () => void {
    this.listeners.add(listener);
    if (!this.isRunning) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  getLatestPrices(): StreamUpdate[] {
    const updates: StreamUpdate[] = [];
    for (const mt of MARKET_TYPES) {
      const provider = marketRegistry.getProvider(mt);
      const assets = provider.getAssets();
      const prices: Record<string, CurrentPrice> = {};
      for (const asset of assets) {
        prices[asset.id] = provider.getCurrentPrice(asset.id);
      }
      updates.push({ marketType: mt, prices, timestamp: Date.now() });
    }
    return updates;
  }
}

export const marketStream = new MarketStream();
