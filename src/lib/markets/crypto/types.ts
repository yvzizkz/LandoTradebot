import { BaseAsset } from '@/types/market';

export interface CryptoAsset extends BaseAsset {
  marketType: 'crypto';
  marketCap: number;
  circulatingSupply: number;
  maxSupply: number | null;
  rank: number;
}
