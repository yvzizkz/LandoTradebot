import { NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/ai/engine';
import { MarketType, MARKET_TYPES } from '@/types/market';
import { AnalysisType } from '@/types/ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const analysisSchema = z.object({
  marketType: z.enum(['crypto', 'forex', 'kalshi', 'polymarket', 'sports'] as const),
  analysisType: z.enum(['market_overview', 'trade_signal', 'risk_assessment', 'custom'] as const),
  customPrompt: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analysisSchema.parse(body);

    const result = await runAnalysis(parsed.marketType, parsed.analysisType, {
      customPrompt: parsed.customPrompt,
      includeReasoning: false,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
