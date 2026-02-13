import { MarketType } from '@/types/market';
import { AnalysisType, AnalysisResponse } from '@/types/ai';
import { analyzeMarket } from './market-analyzer';
import { reasonAboutTrade } from './trade-reasoner';

export async function runAnalysis(
  marketType: MarketType,
  analysisType: AnalysisType,
  options: {
    customPrompt?: string;
    includeReasoning?: boolean;
  } = {}
): Promise<AnalysisResponse> {
  if (options.includeReasoning) {
    const question = options.customPrompt || `Provide a comprehensive ${analysisType.replace('_', ' ')} for the ${marketType} market.`;
    return reasonAboutTrade(marketType, question);
  }

  return analyzeMarket(marketType, analysisType, options.customPrompt);
}
