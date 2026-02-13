import { getOpenAIClient } from '@/lib/openai';
import { MarketType } from '@/types/market';
import { AnalysisType, AnalysisResponse, TradeSignal } from '@/types/ai';
import { buildAnalysisPrompt } from './prompts';
import { marketRegistry } from '@/lib/markets/registry';
import { v4 as uuidv4 } from 'uuid';

function getMarketDataString(marketType: MarketType): string {
  const provider = marketRegistry.getProvider(marketType);
  const assets = provider.getAssets();
  const data = assets.map((asset) => {
    const price = provider.getCurrentPrice(asset.id);
    return {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      price: price.last,
      change24h: price.changePercent24h,
      volume24h: price.volume24h,
      high24h: price.high24h,
      low24h: price.low24h,
      bid: price.bid,
      ask: price.ask,
    };
  });
  return JSON.stringify(data, null, 2);
}

export async function analyzeMarket(
  marketType: MarketType,
  analysisType: AnalysisType,
  customPrompt?: string
): Promise<AnalysisResponse> {
  const openai = getOpenAIClient();
  const marketData = getMarketDataString(marketType);
  const { systemPrompt, userPrompt } = buildAnalysisPrompt(marketType, analysisType, marketData, customPrompt);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content || '{}';
  let parsed: { summary?: string; analysis?: string; signals?: TradeSignal[]; confidence?: number };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { summary: content, analysis: content, signals: [], confidence: 50 };
  }

  return {
    id: uuidv4(),
    request: { marketType, analysisType, customPrompt, includeReasoning: false },
    model: 'gpt-4o',
    summary: parsed.summary || 'Analysis complete',
    analysis: parsed.analysis || content,
    signals: parsed.signals || [],
    confidence: parsed.confidence || 50,
    timestamp: Date.now(),
  };
}
