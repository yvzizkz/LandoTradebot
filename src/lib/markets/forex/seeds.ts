import { ForexPair } from './types';

export const FOREX_PAIRS: ForexPair[] = [
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', marketType: 'forex', baseCurrency: 'EUR', quoteCurrency: 'USD', pipSize: 0.0001, lotSize: 100000 },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar', marketType: 'forex', baseCurrency: 'GBP', quoteCurrency: 'USD', pipSize: 0.0001, lotSize: 100000 },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', marketType: 'forex', baseCurrency: 'USD', quoteCurrency: 'JPY', pipSize: 0.01, lotSize: 100000 },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', marketType: 'forex', baseCurrency: 'AUD', quoteCurrency: 'USD', pipSize: 0.0001, lotSize: 100000 },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', marketType: 'forex', baseCurrency: 'USD', quoteCurrency: 'CAD', pipSize: 0.0001, lotSize: 100000 },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', marketType: 'forex', baseCurrency: 'USD', quoteCurrency: 'CHF', pipSize: 0.0001, lotSize: 100000 },
];

export const FOREX_INITIAL_PRICES: Record<string, number> = {
  eurusd: 1.0850,
  gbpusd: 1.2650,
  usdjpy: 149.50,
  audusd: 0.6550,
  usdcad: 1.3620,
  usdchf: 0.8780,
};

export const FOREX_VOLATILITY: Record<string, number> = {
  eurusd: 0.003,
  gbpusd: 0.004,
  usdjpy: 0.004,
  audusd: 0.005,
  usdcad: 0.003,
  usdchf: 0.003,
};
