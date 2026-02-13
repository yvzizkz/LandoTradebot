import { MarketType } from '@/types/market';
import { AnalysisType } from '@/types/ai';

const MARKET_SYSTEM_PROMPTS: Record<MarketType, string> = {
  crypto: `You are an expert cryptocurrency market analyst for the MoltBolt TraderBot. You analyze Bitcoin, Ethereum, and altcoin markets with deep understanding of on-chain metrics, market sentiment, technical analysis, and macro factors affecting crypto prices.`,
  forex: `You are an expert foreign exchange market analyst for the MoltBolt TraderBot. You analyze major currency pairs with expertise in central bank policies, economic indicators, geopolitical factors, and technical analysis of forex markets.`,
  kalshi: `You are an expert event contract analyst for the MoltBolt TraderBot. You analyze Kalshi event-based contracts including economic events, weather events, and political outcomes. You understand probability assessment and contract pricing.`,
  polymarket: `You are an expert prediction market analyst for the MoltBolt TraderBot. You analyze Polymarket contracts covering politics, technology, science, and crypto predictions. You excel at probabilistic reasoning and identifying mispriced contracts.`,
  sports: `You are an expert sports betting analyst for the MoltBolt TraderBot. You analyze odds across NFL, NBA, MLB, NHL, soccer, and MMA. You understand moneyline, spread, and over/under betting with statistical modeling expertise.`,
};

const ANALYSIS_TYPE_INSTRUCTIONS: Record<AnalysisType, string> = {
  market_overview: `Provide a comprehensive market overview including:
1. Current market sentiment (bullish/bearish/neutral)
2. Key trends and patterns
3. Notable price movements
4. Risk factors to watch
5. Short-term outlook`,
  trade_signal: `Generate specific trade signals including:
1. Clear buy/sell/hold recommendations for each asset
2. Confidence level (0-100) for each signal
3. Entry price targets
4. Stop-loss levels
5. Brief rationale for each signal`,
  risk_assessment: `Perform a risk assessment including:
1. Overall market risk level (low/medium/high)
2. Correlation risks across assets
3. Volatility analysis
4. Potential downside scenarios
5. Hedging recommendations`,
  custom: `Analyze based on the user's specific question. Provide detailed, actionable insights.`,
};

export function buildAnalysisPrompt(
  marketType: MarketType,
  analysisType: AnalysisType,
  marketData: string,
  customPrompt?: string
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `${MARKET_SYSTEM_PROMPTS[marketType]}

You always respond with structured JSON containing:
- "summary": A 1-2 sentence executive summary
- "analysis": Detailed analysis in markdown format
- "signals": Array of trade signals, each with: assetId, assetSymbol, action (strong_buy|buy|hold|sell|strong_sell), confidence (0-100), rationale
- "confidence": Overall analysis confidence (0-100)`;

  const instructions = customPrompt
    ? `${ANALYSIS_TYPE_INSTRUCTIONS.custom}\n\nUser question: ${customPrompt}`
    : ANALYSIS_TYPE_INSTRUCTIONS[analysisType];

  const userPrompt = `${instructions}

Current Market Data:
${marketData}

Respond with valid JSON matching the schema described in your instructions.`;

  return { systemPrompt, userPrompt };
}

export function buildReasoningPrompt(
  marketType: MarketType,
  marketData: string,
  question: string
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `${MARKET_SYSTEM_PROMPTS[marketType]}

You are using advanced reasoning to deeply analyze complex trading decisions. Think through multiple factors, weigh pros and cons, and arrive at well-reasoned conclusions. Consider correlations across markets, second-order effects, and risk-reward tradeoffs.`;

  const userPrompt = `${question}

Current Market Data:
${marketData}

Provide your detailed reasoning and final recommendation.`;

  return { systemPrompt, userPrompt };
}
