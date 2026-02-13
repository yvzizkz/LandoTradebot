import { MarketType } from './market';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected';

export interface TradeOrder {
  id: string;
  marketType: MarketType;
  assetId: string;
  assetSymbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  limitPrice?: number;
  status: OrderStatus;
  timestamp: number;
  pnl?: number;
}

export interface Position {
  id: string;
  marketType: MarketType;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openedAt: number;
}
