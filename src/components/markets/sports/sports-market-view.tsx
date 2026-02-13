"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SportsAsset {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  odds: {
    moneyline: { home: number; away: number; draw?: number };
    spread: { home: number; away: number; line: number };
    overUnder: { over: number; under: number; line: number };
  };
  score?: { home: number; away: number };
}

function formatOdds(odds: number): string {
  return odds >= 0 ? `+${Math.round(odds)}` : `${Math.round(odds)}`;
}

export function SportsMarketView() {
  const [events, setEvents] = useState<SportsAsset[]>([]);

  useEffect(() => {
    fetch('/api/markets/sports')
      .then((r) => r.json())
      .then((data) => { if (data.assets) setEvents(data.assets); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{event.league}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <Badge variant={event.status === 'live' ? 'default' : 'secondary'}>{event.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <p className="text-sm font-bold">{event.homeTeam}</p>
                  {event.score && <p className="text-2xl font-bold mt-1">{event.score.home}</p>}
                </div>
                <span className="text-xs text-muted-foreground px-4">VS</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{event.awayTeam}</p>
                  {event.score && <p className="text-2xl font-bold mt-1">{event.score.away}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border p-2">
                  <p className="text-xs text-muted-foreground mb-1">Moneyline</p>
                  <div className="flex justify-between text-xs">
                    <span>{formatOdds(event.odds.moneyline.home)}</span>
                    {event.odds.moneyline.draw !== undefined && <span>{formatOdds(event.odds.moneyline.draw)}</span>}
                    <span>{formatOdds(event.odds.moneyline.away)}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <p className="text-xs text-muted-foreground mb-1">Spread</p>
                  <div className="flex justify-between text-xs">
                    <span>{event.odds.spread.home > 0 ? '+' : ''}{event.odds.spread.home}</span>
                    <span>{event.odds.spread.away > 0 ? '+' : ''}{event.odds.spread.away}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <p className="text-xs text-muted-foreground mb-1">O/U {event.odds.overUnder.line}</p>
                  <div className="flex justify-between text-xs">
                    <span>O {formatOdds(event.odds.overUnder.over)}</span>
                    <span>U {formatOdds(event.odds.overUnder.under)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {events.length === 0 && <p className="text-sm text-muted-foreground">Loading sports events...</p>}
    </div>
  );
}
