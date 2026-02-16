import { NextResponse } from 'next/server';
import { marketRegistry } from '@/lib/markets/registry';
import { ensureInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureInitialized();
  const info = marketRegistry.getProviderInfo();
  return NextResponse.json(info);
}
