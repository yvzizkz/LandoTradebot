import { NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/ai/engine';
import { ensureInitialized } from '@/lib/init';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reasonSchema = z.object({
  marketType: z.enum(['crypto', 'forex', 'kalshi', 'polymarket', 'sports'] as const),
  customPrompt: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const parsed = reasonSchema.parse(body);

    const result = await runAnalysis(parsed.marketType, 'custom', {
      customPrompt: parsed.customPrompt,
      includeReasoning: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Reasoning failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
