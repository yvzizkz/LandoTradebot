import { TradeOrder, OrderSide, OrderType } from '@/types/trade';
import { MarketType } from '@/types/market';
import { TradeExecutionResult } from './types';
import { portfolioManager } from './portfolio';
import { marketRegistry } from '@/lib/markets/registry';
import { v4 as uuidv4 } from 'uuid';

export async function executeTrade(params: {
  marketType: MarketType;
  assetId: string;
  assetSymbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
}): Promise<TradeExecutionResult> {
  const { marketType, assetId, assetSymbol, side, type, quantity, limitPrice } = params;

  const provider = marketRegistry.getProvider(marketType);
  const currentPrice = await provider.getCurrentPrice(assetId);
  const executionPrice = side === 'buy' ? currentPrice.ask : currentPrice.bid;

  // Check if user has enough cash for buy
  if (side === 'buy') {
    const cost = executionPrice * quantity;
    const cashBalance = await portfolioManager.getCashBalance();
    if (cost > cashBalance) {
      return {
        success: false, orderId: '', executionPrice,
        filledQuantity: 0, fee: 0, message: 'Insufficient funds',
        timestamp: Date.now(),
      };
    }
  }

  // Check if user has position to sell
  if (side === 'sell') {
    const positions = await portfolioManager.getPositions();
    const position = positions.find(p => p.assetId === assetId && p.side === 'buy');
    if (!position || position.quantity < quantity) {
      return {
        success: false, orderId: '', executionPrice,
        filledQuantity: 0, fee: 0, message: 'Insufficient position size',
        timestamp: Date.now(),
      };
    }
  }

  // Submit order to exchange provider
  const orderResult = await provider.placeOrder({
    assetId,
    assetSymbol,
    side,
    type,
    quantity,
    limitPrice,
  });

  if (orderResult.status === 'rejected') {
    const order: TradeOrder = {
      id: uuidv4(), marketType, assetId, assetSymbol, side, type, quantity,
      price: executionPrice, limitPrice, status: 'rejected',
      timestamp: Date.now(),
    };
    await portfolioManager.addTrade(order, provider.exchangeId, orderResult.exchangeOrderId);
    return {
      success: false, orderId: order.id, exchangeOrderId: orderResult.exchangeOrderId,
      executionPrice, filledQuantity: 0, fee: 0,
      message: 'Order rejected by exchange',
      timestamp: Date.now(),
    };
  }

  if (orderResult.status === 'filled') {
    const order: TradeOrder = {
      id: uuidv4(), marketType, assetId, assetSymbol, side, type, quantity,
      price: orderResult.avgFillPrice, limitPrice, status: 'filled',
      timestamp: Date.now(),
    };
    await portfolioManager.addTrade(order, provider.exchangeId, orderResult.exchangeOrderId, orderResult.fee);
    return {
      success: true, orderId: order.id, exchangeOrderId: orderResult.exchangeOrderId,
      executionPrice: orderResult.avgFillPrice,
      filledQuantity: orderResult.filledQty,
      fee: orderResult.fee,
      message: `${side.toUpperCase()} ${quantity} ${assetSymbol} at ${orderResult.avgFillPrice.toFixed(4)}`,
      timestamp: Date.now(),
    };
  }

  // Order is open (limit order on real exchange) — start background polling
  const orderId = uuidv4();
  const order: TradeOrder = {
    id: orderId, marketType, assetId, assetSymbol, side, type, quantity,
    price: executionPrice, limitPrice, status: 'pending',
    timestamp: Date.now(),
  };
  await portfolioManager.addTrade(order, provider.exchangeId, orderResult.exchangeOrderId);

  // Background polling for limit order fills (fire and forget)
  pollOrderStatus(provider.exchangeId, marketType, orderResult.exchangeOrderId, orderId, {
    assetId, assetSymbol, side, quantity,
  }).catch(err => console.error('[Executor] Polling error:', err));

  return {
    success: true, orderId, exchangeOrderId: orderResult.exchangeOrderId,
    executionPrice, filledQuantity: 0, fee: 0,
    message: `Limit order placed — waiting for fill`,
    timestamp: Date.now(),
  };
}

async function pollOrderStatus(
  exchangeId: string,
  marketType: MarketType,
  exchangeOrderId: string,
  localOrderId: string,
  orderInfo: { assetId: string; assetSymbol: string; side: OrderSide; quantity: number },
): Promise<void> {
  const provider = marketRegistry.getProvider(marketType);
  const maxPolls = 60;
  const pollIntervalMs = 5000;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    try {
      const status = await provider.getOrderStatus(exchangeOrderId);
      if (status.status === 'filled' || status.status === 'partially_filled') {
        const fillOrder: TradeOrder = {
          id: uuidv4(),
          marketType,
          assetId: orderInfo.assetId,
          assetSymbol: orderInfo.assetSymbol,
          side: orderInfo.side,
          type: 'limit',
          quantity: status.filledQty,
          price: status.avgFillPrice,
          status: 'filled',
          timestamp: Date.now(),
        };
        // Update the existing DB record
        const { prisma } = await import('@/lib/db');
        await prisma.tradeOrder.update({
          where: { id: localOrderId },
          data: {
            status: 'filled',
            filledQty: status.filledQty,
            avgFillPrice: status.avgFillPrice,
            fee: status.fee,
            filledAt: new Date(),
          },
        });
        // Record position/cash changes via a new trade entry
        await portfolioManager.addTrade(fillOrder, exchangeId, exchangeOrderId, status.fee);
        console.log(`[Executor] Order ${exchangeOrderId} filled at ${status.avgFillPrice}`);
        return;
      }
      if (status.status === 'cancelled' || status.status === 'rejected') {
        const { prisma } = await import('@/lib/db');
        await prisma.tradeOrder.update({
          where: { id: localOrderId },
          data: { status: status.status },
        });
        console.log(`[Executor] Order ${exchangeOrderId} ${status.status}`);
        return;
      }
    } catch (err) {
      console.error(`[Executor] Poll error for ${exchangeOrderId}:`, err);
    }
  }
  console.warn(`[Executor] Order ${exchangeOrderId} timed out after ${maxPolls * pollIntervalMs / 1000}s`);
}
