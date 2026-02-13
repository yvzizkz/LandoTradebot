import { SportsEvent } from './types';

export const SPORTS_EVENTS: SportsEvent[] = [
  {
    id: 'nba-lal-bos', symbol: 'LAL-BOS', name: 'Lakers vs Celtics',
    marketType: 'sports', sport: 'nba', league: 'NBA',
    homeTeam: 'Los Angeles Lakers', awayTeam: 'Boston Celtics',
    startTime: '2026-02-15T20:00:00Z', status: 'upcoming',
    odds: {
      moneyline: { home: -150, away: +130 },
      spread: { home: -3.5, away: +3.5, line: -110 },
      overUnder: { over: -110, under: -110, line: 224.5 },
    },
  },
  {
    id: 'nfl-kc-sf', symbol: 'KC-SF', name: 'Chiefs vs 49ers',
    marketType: 'sports', sport: 'nfl', league: 'NFL',
    homeTeam: 'Kansas City Chiefs', awayTeam: 'San Francisco 49ers',
    startTime: '2026-02-16T18:30:00Z', status: 'upcoming',
    odds: {
      moneyline: { home: -120, away: +100 },
      spread: { home: -1.5, away: +1.5, line: -110 },
      overUnder: { over: -110, under: -110, line: 47.5 },
    },
  },
  {
    id: 'soccer-mci-ars', symbol: 'MCI-ARS', name: 'Man City vs Arsenal',
    marketType: 'sports', sport: 'soccer', league: 'Premier League',
    homeTeam: 'Manchester City', awayTeam: 'Arsenal',
    startTime: '2026-02-17T15:00:00Z', status: 'upcoming',
    odds: {
      moneyline: { home: -130, away: +200, draw: +280 },
      spread: { home: -0.5, away: +0.5, line: -110 },
      overUnder: { over: -120, under: +100, line: 2.5 },
    },
  },
  {
    id: 'mlb-nyy-lad', symbol: 'NYY-LAD', name: 'Yankees vs Dodgers',
    marketType: 'sports', sport: 'mlb', league: 'MLB',
    homeTeam: 'New York Yankees', awayTeam: 'Los Angeles Dodgers',
    startTime: '2026-02-18T19:00:00Z', status: 'upcoming',
    odds: {
      moneyline: { home: +105, away: -125 },
      spread: { home: +1.5, away: -1.5, line: -110 },
      overUnder: { over: -110, under: -110, line: 8.5 },
    },
  },
  {
    id: 'nhl-edm-fla', symbol: 'EDM-FLA', name: 'Oilers vs Panthers',
    marketType: 'sports', sport: 'nhl', league: 'NHL',
    homeTeam: 'Edmonton Oilers', awayTeam: 'Florida Panthers',
    startTime: '2026-02-19T19:30:00Z', status: 'upcoming',
    odds: {
      moneyline: { home: +110, away: -130 },
      spread: { home: +1.5, away: -1.5, line: -110 },
      overUnder: { over: -110, under: -110, line: 6.5 },
    },
  },
];

export const SPORTS_VOLATILITY: Record<string, number> = {
  'nba-lal-bos': 0.01,
  'nfl-kc-sf': 0.008,
  'soccer-mci-ars': 0.012,
  'mlb-nyy-lad': 0.01,
  'nhl-edm-fla': 0.01,
};
