import { Position, TradeOrder } from '@/types/trade';
import { PortfolioSummary, PortfolioSnapshot, MarketBreakdown } from '@/types/portfolio';
import { MarketType, MARKET_TYPES } from '@/types/market';
import { v4 as uuidv4 } from 'uuid';
import { marketRegistry } from '@/lib/markets/registry';

const INITIAL_CASH = 100_000;

class PortfolioManager {
  private cashBalance: number = INITIAL_CASH;
  private positions: Position[] = [];
  private tradeHistory: TradeOrder[] = [];
  private snapshots: PortfolioSnapshot[] = [];
  private initialValue: number = INITIAL_CASH;

  constructor() {
    this.snapshots.push({ timestamp: Date.now(), totalValue: INITIAL_CASH });
  }

  getCashBalance(): number {
    return this.cashBalance;
  }

  getPositions(): Position[] {
    return this.positions;
  }

  getTradeHistory(): TradeOrder[] {
    return this.tradeHistory;
  }

  getSnapshots(): PortfolioSnapshot[] {
    return this.snapshots;
  }

  addTrade(order: TradeOrder): void {
    this.tradeHistory.unshift(order);
    if (this.tradeHistory.length > 100) this.tradeHistory.pop();

    if (order.status !== 'filled') return;

    const cost = order.price * order.quantity;

    if (order.side === 'buy') {
      this.cashBalance -= cost;
      const existingPosition = this.positions.find(
        p => p.assetId === order.assetId && p.side === 'buy'
      );
      if (existingPosition) {
        const totalQty = existingPosition.quantity + order.quantity;
        existingPosition.entryPrice =
          (existingPosition.entryPrice * existingPosition.quantity + cost) / totalQty;
        existingPosition.quantity = totalQty;
      } else {
        this.positions.push({
          id: uuidv4(),
          marketType: order.marketType,
          assetId: order.assetId,
          assetSymbol: order.assetSymbol,
          assetName: order.assetSymbol,
          side: 'buy',
          quantity: order.quantity,
          entryPrice: order.price,
          currentPrice: order.price,
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          openedAt: order.timestamp,
        });
      }
    } else {
      this.cashBalance += cost;
      const position = this.positions.find(
        p => p.assetId === order.assetId && p.side === 'buy'
      );
      if (position) {
        position.quantity -= order.quantity;
        if (position.quantity <= 0) {
          this.positions = this.positions.filter(p => p.id !== position.id);
        }
      }
    }
  }

  updatePrices(): void {
    for (const position of this.positions) {
      try {
        const provider = marketRegistry.getProvider(position.marketType);
        const price = provider.getCurrentPrice(position.assetId);
        position.currentPrice = price.last;
        position.unrealizedPnl = (price.last - position.entryPrice) * position.quantity;
        position.unrealizedPnlPercent =
          ((price.last - position.entryPrice) / position.entryPrice) * 100;
      } catch {
        // Skip if provider not found
      }
    }

    const totalValue = this.getTotalValue();
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    if (!lastSnapshot || Date.now() - lastSnapshot.timestamp > 30000) {
      this.snapshots.push({ timestamp: Date.now(), totalValue });
      if (this.snapshots.length > 1000) this.snapshots.shift();
    }
  }

  getTotalValue(): number {
    const positionsValue = this.positions.reduce(
      (sum, p) => sum + p.currentPrice * p.quantity, 0
    );
    return this.cashBalance + positionsValue;
  }

  getSummary(): PortfolioSummary {
    this.updatePrices();
    const totalValue = this.getTotalValue();
    const totalPnl = totalValue - this.initialValue;
    const totalPnlPercent = (totalPnl / this.initialValue) * 100;

    const dayAgoSnapshot = this.snapshots.find(
      s => Date.now() - s.timestamp > 24 * 60 * 60 * 1000
    );
    const dayAgoValue = dayAgoSnapshot?.totalValue || this.initialValue;
    const dailyPnl = totalValue - dayAgoValue;
    const dailyPnlPercent = (dailyPnl / dayAgoValue) * 100;

    const marketBreakdown: MarketBreakdown[] = MARKET_TYPES.map(mt => {
      const marketPositions = this.positions.filter(p => p.marketType === mt);
      const value = marketPositions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
      const pnl = marketPositions.reduce((s, p) => s + p.unrealizedPnl, 0);
      return {
        marketType: mt as MarketType,
        value,
        pnl,
        pnlPercent: value > 0 ? (pnl / (value - pnl)) * 100 : 0,
        positionCount: marketPositions.length,
      };
    });

    return {
      totalValue,
      cashBalance: this.cashBalance,
      totalPnl,
      totalPnlPercent,
      dailyPnl,
      dailyPnlPercent,
      positions: this.positions,
      tradeHistory: this.tradeHistory,
      marketBreakdown,
    };
  }
}

export const portfolioManager = new PortfolioManager();
