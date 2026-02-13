import { BaseAsset } from '@/types/market';

export interface SportsOdds {
  moneyline: { home: number; away: number; draw?: number };
  spread: { home: number; away: number; line: number };
  overUnder: { over: number; under: number; line: number };
}

export interface SportsEvent extends BaseAsset {
  marketType: 'sports';
  sport: 'nfl' | 'nba' | 'mlb' | 'nhl' | 'soccer' | 'mma';
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'final';
  odds: SportsOdds;
  score?: { home: number; away: number };
}
