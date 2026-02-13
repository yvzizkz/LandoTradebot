import { KalshiContract } from './types';

export const KALSHI_CONTRACTS: KalshiContract[] = [
  {
    id: 'fed-rate-cut-mar', symbol: 'FED-MAR', name: 'Fed Rate Cut March 2026',
    marketType: 'kalshi', eventTitle: 'Will the Fed cut rates in March 2026?',
    category: 'Economics', expirationDate: '2026-03-19',
    yesPrice: 35, noPrice: 65, volume: 125000, openInterest: 45000,
    status: 'open',
  },
  {
    id: 'sp500-above-6000', symbol: 'SP6K', name: 'S&P 500 Above 6000 EOY',
    marketType: 'kalshi', eventTitle: 'Will S&P 500 close above 6000 by end of 2026?',
    category: 'Economics', expirationDate: '2026-12-31',
    yesPrice: 62, noPrice: 38, volume: 89000, openInterest: 32000,
    status: 'open',
  },
  {
    id: 'us-recession-2026', symbol: 'RECSN', name: 'US Recession 2026',
    marketType: 'kalshi', eventTitle: 'Will there be a US recession in 2026?',
    category: 'Economics', expirationDate: '2026-12-31',
    yesPrice: 22, noPrice: 78, volume: 200000, openInterest: 78000,
    status: 'open',
  },
  {
    id: 'btc-above-100k', symbol: 'BTC100', name: 'Bitcoin Above $100K',
    marketType: 'kalshi', eventTitle: 'Will Bitcoin exceed $100,000 by June 2026?',
    category: 'Crypto', expirationDate: '2026-06-30',
    yesPrice: 55, noPrice: 45, volume: 340000, openInterest: 120000,
    status: 'open',
  },
  {
    id: 'rain-nyc-tomorrow', symbol: 'NYC-RAIN', name: 'Rain in NYC Tomorrow',
    marketType: 'kalshi', eventTitle: 'Will it rain in NYC tomorrow?',
    category: 'Weather', expirationDate: '2026-02-14',
    yesPrice: 40, noPrice: 60, volume: 15000, openInterest: 5000,
    status: 'open',
  },
];

export const KALSHI_VOLATILITY: Record<string, number> = {
  'fed-rate-cut-mar': 0.02,
  'sp500-above-6000': 0.015,
  'us-recession-2026': 0.01,
  'btc-above-100k': 0.025,
  'rain-nyc-tomorrow': 0.03,
};
