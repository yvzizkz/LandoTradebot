"use client";
import { Card, CardContent } from "@/components/ui/card";
import { CurrentPrice } from "@/types/market";
import { formatCurrency, formatPercent, formatCompactNumber, cn } from "@/lib/utils";

interface MarketStatsProps {
  price: CurrentPrice;
  symbol: string;
}

export function MarketStats({ price, symbol }: MarketStatsProps) {
  const decimals = price.last < 1 ? 6 : price.last < 100 ? 4 : 2;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Last Price</p>
          <p className="text-lg font-bold">{formatCurrency(price.last, decimals)}</p>
          <p className={cn("text-xs", price.changePercent24h >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")}>
            {formatPercent(price.changePercent24h)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Bid / Ask</p>
          <p className="text-sm font-medium">{formatCurrency(price.bid, decimals)}</p>
          <p className="text-sm font-medium">{formatCurrency(price.ask, decimals)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">24h Range</p>
          <p className="text-sm font-medium">{formatCurrency(price.low24h, decimals)}</p>
          <p className="text-sm font-medium">{formatCurrency(price.high24h, decimals)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">24h Volume</p>
          <p className="text-lg font-bold">{formatCompactNumber(price.volume24h)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
