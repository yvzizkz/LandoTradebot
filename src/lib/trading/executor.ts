import { TradeOrder, OrderSide, OrderType } from '@/types/trade';
import { MarketType } from '@/types/market';
import { TradeExecutionResult } from './types';
import { portfolioManager } from './portfolio';
import { marketRegistry } from '@/lib/markets/registry';
import { v4 as uuidv4 } from 'uuid';

export function executeTrade(params: {
  marketType: MarketType;
  assetId: string;
  assetSymbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
}): TradeExecutionResult {
  const { marketType, assetId, assetSymbol, side, type, quantity, limitPrice } = params;

  const provider = marketRegistry.getProvider(marketType);
  const currentPrice = provider.getCurrentPrice(assetId);
  const executionPrice = side === 'buy' ? currentPrice.ask : currentPrice.bid;

  // For limit orders, check if price is acceptable
  if (type === 'limit' && limitPrice !== undefined) {
    if (side === 'buy' && executionPrice > limitPrice) {
      const order: TradeOrder = {
        id: uuidv4(), marketType, assetId, assetSymbol, side, type, quantity,
        price: executionPrice, limitPrice, status: 'rejected',
        timestamp: Date.now(),
      };
      portfolioManager.addTrade(order);
      return {
        success: false, orderId: order.id, executionPrice,
        filledQuantity: 0, message: 'Limit price below current ask',
        timestamp: Date.now(),
      };
    }
    if (side === 'sell' && executionPrice < limitPrice) {
      const order: TradeOrder = {
        id: uuidv4(), marketType, assetId, assetSymbol, side, type, quantity,
        price: executionPrice, limitPrice, status: 'rejected',
        timestamp: Date.now(),
      };
      portfolioManager.addTrade(order);
      return {
        success: false, orderId: order.id, executionPrice,
        filledQuantity: 0, message: 'Limit price above current bid',
        timestamp: Date.now(),
      };
    }
  }

  // Check if user has enough cash for buy
  if (side === 'buy') {
    const cost = executionPrice * quantity;
    if (cost > portfolioManager.getCashBalance()) {
      return {
        success: false, orderId: '', executionPrice,
        filledQuantity: 0, message: 'Insufficient funds',
        timestamp: Date.now(),
      };
    }
  }

  // Check if user has position to sell
  if (side === 'sell') {
    const positions = portfolioManager.getPositions();
    const position = positions.find(p => p.assetId === assetId && p.side === 'buy');
    if (!position || position.quantity < quantity) {
      return {
        success: false, orderId: '', executionPrice,
        filledQuantity: 0, message: 'Insufficient position size',
        timestamp: Date.now(),
      };
    }
  }

  const order: TradeOrder = {
    id: uuidv4(), marketType, assetId, assetSymbol, side, type, quantity,
    price: executionPrice, limitPrice, status: 'filled',
    timestamp: Date.now(),
  };

  portfolioManager.addTrade(order);

  return {
    success: true, orderId: order.id, executionPrice,
    filledQuantity: quantity,
    message: `${side.toUpperCase()} ${quantity} ${assetSymbol} at ${executionPrice.toFixed(4)}`,
    timestamp: Date.now(),
  };
}
