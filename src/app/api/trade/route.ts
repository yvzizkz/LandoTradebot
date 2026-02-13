import { NextResponse } from 'next/server';
import { executeTrade } from '@/lib/trading/executor';
import { portfolioManager } from '@/lib/trading/portfolio';
import { MarketType, MARKET_TYPES } from '@/types/market';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const tradeSchema = z.object({
  marketType: z.enum(['crypto', 'forex', 'kalshi', 'polymarket', 'sports'] as const),
  assetId: z.string().min(1),
  assetSymbol: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit']),
  quantity: z.number().positive(),
  limitPrice: z.number().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = tradeSchema.parse(body);
    const result = executeTrade(parsed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid trade parameters', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Trade execution failed' }, { status: 500 });
  }
}

export async function GET() {
  const history = portfolioManager.getTradeHistory();
  return NextResponse.json(history);
}
