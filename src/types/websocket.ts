import { MarketType, CurrentPrice } from './market';

export type WsMessageType = 'price_update' | 'trade_executed' | 'portfolio_update' | 'connection_status';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  marketType?: MarketType;
  payload: T;
  timestamp: number;
}

export interface PriceUpdatePayload {
  assetId: string;
  price: CurrentPrice;
}

export interface TradeExecutedPayload {
  orderId: string;
  status: 'filled' | 'rejected';
  executionPrice: number;
}
