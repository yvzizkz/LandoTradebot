import { MarketType } from './market';
import { Position, TradeOrder } from './trade';

export interface PortfolioSummary {
  totalValue: number;
  cashBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  positions: Position[];
  tradeHistory: TradeOrder[];
  marketBreakdown: MarketBreakdown[];
}

export interface MarketBreakdown {
  marketType: MarketType;
  value: number;
  pnl: number;
  pnlPercent: number;
  positionCount: number;
}

export interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
}
