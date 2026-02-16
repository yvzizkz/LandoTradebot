export interface TradeExecutionResult {
  success: boolean;
  orderId: string;
  exchangeOrderId?: string;
  executionPrice: number;
  filledQuantity: number;
  fee: number;
  message: string;
  timestamp: number;
}

export interface FillRecord {
  orderId: string;
  exchangeOrderId: string;
  assetId: string;
  assetSymbol: string;
  marketType: string;
  exchange: string;
  side: 'buy' | 'sell';
  filledQty: number;
  avgFillPrice: number;
  fee: number;
  timestamp: number;
}
