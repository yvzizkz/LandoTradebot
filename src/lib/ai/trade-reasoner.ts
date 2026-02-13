import { getOpenAIClient } from '@/lib/openai';
import { MarketType } from '@/types/market';
import { AnalysisResponse } from '@/types/ai';
import { buildReasoningPrompt } from './prompts';
import { marketRegistry } from '@/lib/markets/registry';
import { v4 as uuidv4 } from 'uuid';

function getMarketDataString(marketType: MarketType): string {
  const provider = marketRegistry.getProvider(marketType);
  const assets = provider.getAssets();
  const data = assets.map((asset) => {
    const price = provider.getCurrentPrice(asset.id);
    return {
      id: asset.id, symbol: asset.symbol, name: asset.name,
      price: price.last, change24h: price.changePercent24h,
      volume24h: price.volume24h, bid: price.bid, ask: price.ask,
    };
  });
  return JSON.stringify(data, null, 2);
}

export async function reasonAboutTrade(
  marketType: MarketType,
  question: string
): Promise<AnalysisResponse> {
  const openai = getOpenAIClient();
  const marketData = getMarketDataString(marketType);
  const { systemPrompt, userPrompt } = buildReasoningPrompt(marketType, marketData, question);

  const completion = await openai.chat.completions.create({
    model: 'o4-mini',
    messages: [
      { role: 'developer', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content || '';

  return {
    id: uuidv4(),
    request: { marketType, analysisType: 'custom', customPrompt: question, includeReasoning: true },
    model: 'o4-mini',
    summary: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
    analysis: content,
    signals: [],
    confidence: 70,
    reasoning: content,
    timestamp: Date.now(),
  };
}
