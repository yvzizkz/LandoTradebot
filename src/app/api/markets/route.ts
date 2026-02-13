import { NextResponse } from 'next/server';
import { marketRegistry } from '@/lib/markets/registry';
import { MARKET_TYPES, MARKET_LABELS } from '@/types/market';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = MARKET_TYPES.map((type) => {
    const provider = marketRegistry.getProvider(type);
    const assets = provider.getAssets();
    const assetSummaries = assets.map((asset) => {
      const price = provider.getCurrentPrice(asset.id);
      return {
        ...asset,
        price,
      };
    });

    return {
      marketType: type,
      label: MARKET_LABELS[type],
      assetCount: assets.length,
      assets: assetSummaries,
    };
  });

  return NextResponse.json(summary);
}
