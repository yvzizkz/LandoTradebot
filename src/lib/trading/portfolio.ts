import { Position, TradeOrder } from '@/types/trade';
import { PortfolioSummary, PortfolioSnapshot, MarketBreakdown } from '@/types/portfolio';
import { MarketType, MARKET_TYPES } from '@/types/market';
import { prisma } from '@/lib/db';
import { marketRegistry } from '@/lib/markets/registry';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_CASH = 100_000;

class PortfolioManager {
  private dbInitialized = false;

  private async ensureDb(): Promise<void> {
    if (this.dbInitialized) return;
    // Ensure initial cash ledger entry exists
    const count = await prisma.cashLedger.count();
    if (count === 0) {
      await prisma.cashLedger.create({
        data: {
          id: uuidv4(),
          amount: INITIAL_CASH,
          balance: INITIAL_CASH,
          reason: 'initial_deposit',
        },
      });
      await prisma.portfolioSnapshot.create({
        data: {
          id: uuidv4(),
          totalValue: INITIAL_CASH,
          cashBalance: INITIAL_CASH,
        },
      });
    }
    this.dbInitialized = true;
  }

  async getCashBalance(): Promise<number> {
    await this.ensureDb();
    const latest = await prisma.cashLedger.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return latest?.balance ?? INITIAL_CASH;
  }

  async getPositions(): Promise<Position[]> {
    await this.ensureDb();
    const dbPositions = await prisma.position.findMany({
      where: { isClosed: false },
    });
    return dbPositions.map((p) => ({
      id: p.id,
      marketType: p.marketType as MarketType,
      assetId: p.assetId,
      assetSymbol: p.assetSymbol,
      assetName: p.assetName,
      side: p.side as 'buy' | 'sell',
      quantity: p.quantity,
      entryPrice: p.entryPrice,
      currentPrice: p.entryPrice, // will be updated by updatePrices
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      openedAt: p.openedAt.getTime(),
    }));
  }

  async getTradeHistory(): Promise<TradeOrder[]> {
    await this.ensureDb();
    const dbOrders = await prisma.tradeOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return dbOrders.map((o) => ({
      id: o.id,
      marketType: o.marketType as MarketType,
      assetId: o.assetId,
      assetSymbol: o.assetSymbol,
      side: o.side as 'buy' | 'sell',
      type: o.orderType as 'market' | 'limit',
      quantity: o.filledQty || o.requestedQty,
      price: o.avgFillPrice || o.requestedPrice || 0,
      limitPrice: o.requestedPrice ?? undefined,
      status: o.status as 'pending' | 'filled' | 'rejected' | 'cancelled',
      timestamp: o.createdAt.getTime(),
    }));
  }

  async getSnapshots(): Promise<PortfolioSnapshot[]> {
    await this.ensureDb();
    const dbSnapshots = await prisma.portfolioSnapshot.findMany({
      orderBy: { timestamp: 'asc' },
      take: 1000,
    });
    return dbSnapshots.map((s) => ({
      timestamp: s.timestamp.getTime(),
      totalValue: s.totalValue,
    }));
  }

  async addTrade(order: TradeOrder, exchange: string = 'simulator', exchangeOrderId?: string, fee: number = 0): Promise<void> {
    await this.ensureDb();

    // Create trade record in DB
    await prisma.tradeOrder.create({
      data: {
        id: order.id,
        exchangeOrderId: exchangeOrderId ?? null,
        exchange,
        marketType: order.marketType,
        assetId: order.assetId,
        assetSymbol: order.assetSymbol,
        side: order.side,
        orderType: order.type,
        requestedQty: order.quantity,
        filledQty: order.status === 'filled' ? order.quantity : 0,
        requestedPrice: order.limitPrice ?? null,
        avgFillPrice: order.status === 'filled' ? order.price : null,
        fee,
        status: order.status,
        filledAt: order.status === 'filled' ? new Date(order.timestamp) : null,
      },
    });

    if (order.status !== 'filled') return;

    const cost = order.price * order.quantity;
    const cashBefore = await this.getCashBalance();

    if (order.side === 'buy') {
      // Debit cash
      const newBalance = cashBefore - cost - fee;
      await prisma.cashLedger.create({
        data: {
          id: uuidv4(),
          amount: -(cost + fee),
          balance: newBalance,
          reason: 'trade_buy',
          referenceId: order.id,
        },
      });

      // Update or create position
      const existing = await prisma.position.findFirst({
        where: { assetId: order.assetId, side: 'buy', isClosed: false },
      });

      if (existing) {
        const totalQty = existing.quantity + order.quantity;
        const newEntry = (existing.entryPrice * existing.quantity + cost) / totalQty;
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            quantity: totalQty,
            entryPrice: newEntry,
            totalCost: existing.totalCost + cost,
          },
        });
      } else {
        await prisma.position.create({
          data: {
            id: uuidv4(),
            exchange,
            marketType: order.marketType,
            assetId: order.assetId,
            assetSymbol: order.assetSymbol,
            assetName: order.assetSymbol,
            side: 'buy',
            quantity: order.quantity,
            entryPrice: order.price,
            totalCost: cost,
          },
        });
      }
    } else {
      // Credit cash
      const newBalance = cashBefore + cost - fee;
      await prisma.cashLedger.create({
        data: {
          id: uuidv4(),
          amount: cost - fee,
          balance: newBalance,
          reason: 'trade_sell',
          referenceId: order.id,
        },
      });

      // Reduce or close position
      const position = await prisma.position.findFirst({
        where: { assetId: order.assetId, side: 'buy', isClosed: false },
      });
      if (position) {
        const newQty = position.quantity - order.quantity;
        const realizedPnl = (order.price - position.entryPrice) * order.quantity;
        if (newQty <= 0) {
          await prisma.position.update({
            where: { id: position.id },
            data: {
              quantity: 0,
              isClosed: true,
              closedAt: new Date(),
              realizedPnl: position.realizedPnl + realizedPnl,
            },
          });
        } else {
          await prisma.position.update({
            where: { id: position.id },
            data: {
              quantity: newQty,
              realizedPnl: position.realizedPnl + realizedPnl,
            },
          });
        }
      }
    }
  }

  async getSummary(): Promise<PortfolioSummary> {
    await this.ensureDb();
    const cashBalance = await this.getCashBalance();
    const positions = await this.getPositions();
    const tradeHistory = await this.getTradeHistory();

    // Update positions with live prices
    for (const position of positions) {
      try {
        const provider = marketRegistry.getProvider(position.marketType);
        const price = await provider.getCurrentPrice(position.assetId);
        position.currentPrice = price.last;
        position.unrealizedPnl = (price.last - position.entryPrice) * position.quantity;
        position.unrealizedPnlPercent =
          ((price.last - position.entryPrice) / position.entryPrice) * 100;
      } catch {
        // Skip if provider not ready
      }
    }

    const positionsValue = positions.reduce(
      (sum, p) => sum + p.currentPrice * p.quantity, 0
    );
    const totalValue = cashBalance + positionsValue;
    const totalPnl = totalValue - INITIAL_CASH;
    const totalPnlPercent = (totalPnl / INITIAL_CASH) * 100;

    // Get snapshots for daily P&L
    const snapshots = await this.getSnapshots();
    const dayAgoSnapshot = snapshots.find(
      s => Date.now() - s.timestamp > 24 * 60 * 60 * 1000
    );
    const dayAgoValue = dayAgoSnapshot?.totalValue || INITIAL_CASH;
    const dailyPnl = totalValue - dayAgoValue;
    const dailyPnlPercent = (dailyPnl / dayAgoValue) * 100;

    // Record periodic snapshot
    const lastSnapshot = snapshots[snapshots.length - 1];
    if (!lastSnapshot || Date.now() - lastSnapshot.timestamp > 30000) {
      await prisma.portfolioSnapshot.create({
        data: {
          id: uuidv4(),
          totalValue,
          cashBalance,
        },
      });
    }

    const marketBreakdown: MarketBreakdown[] = MARKET_TYPES.map(mt => {
      const marketPositions = positions.filter(p => p.marketType === mt);
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
      cashBalance,
      totalPnl,
      totalPnlPercent,
      dailyPnl,
      dailyPnlPercent,
      positions,
      tradeHistory,
      marketBreakdown,
    };
  }
}

export const portfolioManager = new PortfolioManager();
