import { CryptoAsset } from './types';

export const CRYPTO_ASSETS: CryptoAsset[] = [
  {
    id: 'btc', symbol: 'BTC', name: 'Bitcoin', marketType: 'crypto',
    marketCap: 1_800_000_000_000, circulatingSupply: 19_600_000, maxSupply: 21_000_000, rank: 1,
  },
  {
    id: 'eth', symbol: 'ETH', name: 'Ethereum', marketType: 'crypto',
    marketCap: 400_000_000_000, circulatingSupply: 120_000_000, maxSupply: null, rank: 2,
  },
  {
    id: 'sol', symbol: 'SOL', name: 'Solana', marketType: 'crypto',
    marketCap: 80_000_000_000, circulatingSupply: 440_000_000, maxSupply: null, rank: 5,
  },
  {
    id: 'bnb', symbol: 'BNB', name: 'BNB', marketType: 'crypto',
    marketCap: 90_000_000_000, circulatingSupply: 150_000_000, maxSupply: 200_000_000, rank: 4,
  },
  {
    id: 'xrp', symbol: 'XRP', name: 'XRP', marketType: 'crypto',
    marketCap: 35_000_000_000, circulatingSupply: 53_000_000_000, maxSupply: 100_000_000_000, rank: 6,
  },
  {
    id: 'ada', symbol: 'ADA', name: 'Cardano', marketType: 'crypto',
    marketCap: 15_000_000_000, circulatingSupply: 35_000_000_000, maxSupply: 45_000_000_000, rank: 8,
  },
];

export const CRYPTO_INITIAL_PRICES: Record<string, number> = {
  btc: 94500,
  eth: 3350,
  sol: 185,
  bnb: 610,
  xrp: 0.65,
  ada: 0.42,
};

export const CRYPTO_VOLATILITY: Record<string, number> = {
  btc: 0.02,
  eth: 0.025,
  sol: 0.04,
  bnb: 0.022,
  xrp: 0.035,
  ada: 0.038,
};
