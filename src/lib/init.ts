import { marketRegistry } from '@/lib/markets/registry';

let initPromise: Promise<void> | null = null;

export async function ensureInitialized(): Promise<void> {
  if (marketRegistry.isInitialized()) return;
  if (!initPromise) {
    initPromise = marketRegistry.initialize();
  }
  await initPromise;
}
