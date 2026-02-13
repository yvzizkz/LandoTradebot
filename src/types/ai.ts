import { MarketType } from './market';

export type AnalysisType = 'market_overview' | 'trade_signal' | 'risk_assessment' | 'custom';
export type AiModel = 'gpt-4o' | 'o4-mini';

export interface AnalysisRequest {
  marketType: MarketType;
  assetId?: string;
  analysisType: AnalysisType;
  customPrompt?: string;
  includeReasoning: boolean;
}

export interface AnalysisResponse {
  id: string;
  request: AnalysisRequest;
  model: AiModel;
  summary: string;
  analysis: string;
  signals: TradeSignal[];
  confidence: number;
  reasoning?: string;
  timestamp: number;
}

export interface TradeSignal {
  assetId: string;
  assetSymbol: string;
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  targetPrice?: number;
  stopLoss?: number;
  confidence: number;
  rationale: string;
}
