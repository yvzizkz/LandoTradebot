import { NextResponse } from 'next/server';
import { marketRegistry } from '@/lib/markets/registry';
import { MarketType, MARKET_TYPES } from '@/types/market';
import { ensureInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  await ensureInitialized();
  const { type } = await params;

  if (!MARKET_TYPES.includes(type as MarketType)) {
    return NextResponse.json({ error: 'Invalid market type' }, { status: 400 });
  }

  const provider = marketRegistry.getProvider(type as MarketType);
  const assets = await provider.getAssets();
  const assetsWithPrices = await Promise.all(
    assets.map(async (asset) => ({
      ...asset,
      price: await provider.getCurrentPrice(asset.id),
      history: await provider.getPriceHistory(asset.id, 50),
    }))
  );

  return NextResponse.json({
    marketType: type,
    assets: assetsWithPrices,
  });
}
