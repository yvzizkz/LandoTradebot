export type MarketType = 'crypto' | 'forex' | 'kalshi' | 'polymarket' | 'sports';

export const MARKET_LABELS: Record<MarketType, string> = {
  crypto: 'Crypto',
  forex: 'Forex',
  kalshi: 'Kalshi',
  polymarket: 'Polymarket',
  sports: 'Sports',
};

export const MARKET_TYPES: MarketType[] = ['crypto', 'forex', 'kalshi', 'polymarket', 'sports'];

export interface BaseAsset {
  id: string;
  symbol: string;
  name: string;
  marketType: MarketType;
}

export interface PricePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CurrentPrice {
  bid: number;
  ask: number;
  last: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface MarketDataProvider<T extends BaseAsset = BaseAsset> {
  marketType: MarketType;
  getAssets(): T[];
  getAsset(id: string): T | undefined;
  getCurrentPrice(assetId: string): CurrentPrice;
  getPriceHistory(assetId: string, periods: number): PricePoint[];
  tick(): Map<string, CurrentPrice>;
}

// --- Exchange Provider (async, for real exchanges + simulator adapter) ---

export interface ExchangeOrderParams {
  assetId: string;
  assetSymbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  limitPrice?: number;
}

export interface ExchangeOrderResult {
  exchangeOrderId: string;
  status: 'filled' | 'open' | 'rejected';
  filledQty: number;
  avgFillPrice: number;
  fee: number;
  feeCurrency: string;
  rawResponse?: unknown;
}

export type ExchangeOrderStatus = {
  exchangeOrderId: string;
  status: 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  filledQty: number;
  avgFillPrice: number;
  fee: number;
};

export interface ExchangeProvider<T extends BaseAsset = BaseAsset> {
  marketType: MarketType;
  exchangeId: string;
  isSimulator: boolean;

  initialize(): Promise<void>;
  destroy(): Promise<void>;

  // Market data (async)
  getAssets(): Promise<T[]>;
  getAsset(id: string): Promise<T | undefined>;
  getCurrentPrice(assetId: string): Promise<CurrentPrice>;
  getPriceHistory(assetId: string, periods: number): Promise<PricePoint[]>;

  // Trading
  placeOrder(params: ExchangeOrderParams): Promise<ExchangeOrderResult>;
  getOrderStatus(exchangeOrderId: string): Promise<ExchangeOrderStatus>;
  cancelOrder(exchangeOrderId: string): Promise<boolean>;

  // Streaming (called by market-stream on interval)
  tick(): Promise<Map<string, CurrentPrice>>;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
}
