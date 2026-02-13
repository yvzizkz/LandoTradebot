"use client";
import { useMarketStore } from "@/stores/market-store";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PriceTicker() {
  const { priceData, selectedMarket } = useMarketStore();
  const marketPrices = priceData[selectedMarket] || {};
  const entries = Object.entries(marketPrices).slice(0, 5);

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        Loading prices...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 overflow-hidden">
      {entries.map(([assetId, price]) => (
        <div key={assetId} className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground">{assetId.toUpperCase()}</span>
          <span className="text-muted-foreground">{formatCurrency(price.last, price.last < 1 ? 4 : 2)}</span>
          <span className={cn(
            "font-medium",
            price.changePercent24h >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
          )}>
            {formatPercent(price.changePercent24h)}
          </span>
        </div>
      ))}
    </div>
  );
}
