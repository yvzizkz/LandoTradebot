import { NextResponse } from 'next/server';
import { marketRegistry } from '@/lib/markets/registry';
import { MARKET_TYPES, MARKET_LABELS } from '@/types/market';
import { ensureInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureInitialized();

  const summary = await Promise.all(
    MARKET_TYPES.map(async (type) => {
      const provider = marketRegistry.getProvider(type);
      const assets = await provider.getAssets();
      const assetSummaries = await Promise.all(
        assets.map(async (asset) => {
          const price = await provider.getCurrentPrice(asset.id);
          return { ...asset, price };
        })
      );

      return {
        marketType: type,
        label: MARKET_LABELS[type],
        assetCount: assets.length,
        assets: assetSummaries,
      };
    })
  );

  return NextResponse.json(summary);
}
