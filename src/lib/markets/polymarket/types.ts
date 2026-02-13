import { BaseAsset } from '@/types/market';

export interface PolymarketOutcome {
  id: string;
  label: string;
  price: number;
  volume: number;
}

export interface PolymarketContract extends BaseAsset {
  marketType: 'polymarket';
  question: string;
  category: string;
  endDate: string;
  outcomes: PolymarketOutcome[];
  totalVolume: number;
  liquidity: number;
  resolved: boolean;
  resolvedOutcome?: string;
}
