import { create } from 'zustand';
import { Position, TradeOrder } from '@/types/trade';
import { PortfolioSnapshot, MarketBreakdown } from '@/types/portfolio';

interface PortfolioState {
  totalValue: number;
  cashBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  positions: Position[];
  tradeHistory: TradeOrder[];
  marketBreakdown: MarketBreakdown[];
  snapshots: PortfolioSnapshot[];
  updatePortfolio: (data: Partial<PortfolioState>) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  totalValue: 100000,
  cashBalance: 100000,
  totalPnl: 0,
  totalPnlPercent: 0,
  dailyPnl: 0,
  dailyPnlPercent: 0,
  positions: [],
  tradeHistory: [],
  marketBreakdown: [],
  snapshots: [{ timestamp: Date.now(), totalValue: 100000 }],
  updatePortfolio: (data) => set((state) => ({ ...state, ...data })),
}));
