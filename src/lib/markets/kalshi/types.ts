import { BaseAsset } from '@/types/market';

export interface KalshiContract extends BaseAsset {
  marketType: 'kalshi';
  eventTitle: string;
  category: string;
  expirationDate: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  openInterest: number;
  status: 'open' | 'closed' | 'settled';
  result?: 'yes' | 'no';
}
