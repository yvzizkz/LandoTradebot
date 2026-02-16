import { marketRegistry } from '@/lib/markets/registry';
import { MarketType, CurrentPrice, MARKET_TYPES } from '@/types/market';
import { ensureInitialized } from '@/lib/init';

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

  private async tick(): Promise<void> {
    try {
      await ensureInitialized();
      const allUpdates = await marketRegistry.tickAll();
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
          this.listeners.delete(listener);
        }
      }
    } catch (err) {
      console.error('[MarketStream] tick error:', err);
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

  async getLatestPrices(): Promise<StreamUpdate[]> {
    await ensureInitialized();
    const updates: StreamUpdate[] = [];
    for (const mt of MARKET_TYPES) {
      const provider = marketRegistry.getProvider(mt);
      const assets = await provider.getAssets();
      const prices: Record<string, CurrentPrice> = {};
      for (const asset of assets) {
        prices[asset.id] = await provider.getCurrentPrice(asset.id);
      }
      updates.push({ marketType: mt, prices, timestamp: Date.now() });
    }
    return updates;
  }
}

export const marketStream = new MarketStream();
