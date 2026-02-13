import { NextResponse } from 'next/server';
import { portfolioManager } from '@/lib/trading/portfolio';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = portfolioManager.getSummary();
  return NextResponse.json(summary);
}
