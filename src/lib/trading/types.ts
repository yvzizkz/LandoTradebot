export interface TradeExecutionResult {
  success: boolean;
  orderId: string;
  executionPrice: number;
  filledQuantity: number;
  message: string;
  timestamp: number;
}
