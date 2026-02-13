import { BaseAsset } from '@/types/market';

export interface ForexPair extends BaseAsset {
  marketType: 'forex';
  baseCurrency: string;
  quoteCurrency: string;
  pipSize: number;
  lotSize: number;
}
