import { PolymarketContract } from './types';

export const POLYMARKET_CONTRACTS: PolymarketContract[] = [
  {
    id: 'us-pres-2028', symbol: 'PRES28', name: '2028 Presidential Election',
    marketType: 'polymarket', question: 'Who will win the 2028 US Presidential Election?',
    category: 'Politics', endDate: '2028-11-05',
    outcomes: [
      { id: 'dem', label: 'Democrat', price: 0.48, volume: 5000000 },
      { id: 'rep', label: 'Republican', price: 0.47, volume: 4800000 },
      { id: 'other', label: 'Other', price: 0.05, volume: 200000 },
    ],
    totalVolume: 10000000, liquidity: 2500000, resolved: false,
  },
  {
    id: 'ai-agi-2026', symbol: 'AGI26', name: 'AGI by End of 2026',
    marketType: 'polymarket', question: 'Will AGI be achieved by end of 2026?',
    category: 'Technology', endDate: '2026-12-31',
    outcomes: [
      { id: 'yes', label: 'Yes', price: 0.08, volume: 3200000 },
      { id: 'no', label: 'No', price: 0.92, volume: 3500000 },
    ],
    totalVolume: 6700000, liquidity: 1800000, resolved: false,
  },
  {
    id: 'spacex-mars-2030', symbol: 'MARS30', name: 'SpaceX Mars Landing by 2030',
    marketType: 'polymarket', question: 'Will SpaceX land humans on Mars before 2030?',
    category: 'Science', endDate: '2030-01-01',
    outcomes: [
      { id: 'yes', label: 'Yes', price: 0.12, volume: 1500000 },
      { id: 'no', label: 'No', price: 0.88, volume: 1600000 },
    ],
    totalVolume: 3100000, liquidity: 900000, resolved: false,
  },
  {
    id: 'eth-flip-btc', symbol: 'FLIP', name: 'ETH Flippening',
    marketType: 'polymarket', question: 'Will Ethereum market cap exceed Bitcoin by 2027?',
    category: 'Crypto', endDate: '2027-01-01',
    outcomes: [
      { id: 'yes', label: 'Yes', price: 0.15, volume: 2100000 },
      { id: 'no', label: 'No', price: 0.85, volume: 2400000 },
    ],
    totalVolume: 4500000, liquidity: 1200000, resolved: false,
  },
];

export const POLYMARKET_VOLATILITY: Record<string, number> = {
  'us-pres-2028': 0.008,
  'ai-agi-2026': 0.015,
  'spacex-mars-2030': 0.005,
  'eth-flip-btc': 0.012,
};
