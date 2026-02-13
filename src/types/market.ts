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
