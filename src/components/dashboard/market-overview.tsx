"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarketStore } from "@/stores/market-store";
import { MARKET_TYPES, MARKET_LABELS, MarketType } from "@/types/market";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { Bitcoin, DollarSign, BarChart3, TrendingUp, Trophy } from "lucide-react";

const MARKET_ICONS: Record<MarketType, React.ComponentType<{ className?: string }>> = {
  crypto: Bitcoin,
  forex: DollarSign,
  kalshi: BarChart3,
  polymarket: TrendingUp,
  sports: Trophy,
};

export function MarketOverview() {
  const { priceData } = useMarketStore();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {MARKET_TYPES.map((type) => {
        const Icon = MARKET_ICONS[type];
        const prices = priceData[type] || {};
        const entries = Object.entries(prices);
        const topAssets = entries.slice(0, 3);
        const avgChange = entries.length > 0
          ? entries.reduce((sum, [, p]) => sum + p.changePercent24h, 0) / entries.length
          : 0;

        return (
          <Link key={type} href={`/market/${type}`}>
            <Card className="cursor-pointer transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {MARKET_LABELS[type]}
                </CardTitle>
                <Badge variant={avgChange >= 0 ? "default" : "destructive"} className="text-xs">
                  {formatPercent(avgChange)}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {topAssets.map(([id, price]) => (
                    <div key={id} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">{id.toUpperCase()}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(price.last, price.last < 1 ? 4 : 2)}</span>
                        <span className={cn(
                          price.changePercent24h >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                        )}>
                          {formatPercent(price.changePercent24h)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
