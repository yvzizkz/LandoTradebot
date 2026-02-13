"use client";
import { useEffect, useState } from "react";
import { PriceChart } from "@/components/markets/price-chart";
import { MarketStats } from "@/components/markets/market-stats";
import { OrderBook } from "@/components/markets/order-book";
import { useMarketStore } from "@/stores/market-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent, formatCompactNumber, cn } from "@/lib/utils";
import { PricePoint } from "@/types/market";

export function CryptoMarketView() {
  const { priceData } = useMarketStore();
  const prices = priceData.crypto || {};
  const [selectedAsset, setSelectedAsset] = useState<string>("btc");
  const [history, setHistory] = useState<PricePoint[]>([]);

  useEffect(() => {
    fetch(`/api/markets/crypto`)
      .then((r) => r.json())
      .then((data) => {
        const asset = data.assets?.find((a: { id: string }) => a.id === selectedAsset);
        if (asset?.history) setHistory(asset.history);
      })
      .catch(() => {});
  }, [selectedAsset]);

  const currentPrice = prices[selectedAsset];
  const entries = Object.entries(prices);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {entries.map(([id, price]) => (
          <button
            key={id}
            onClick={() => setSelectedAsset(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              id === selectedAsset ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
            )}
          >
            <span className="font-semibold">{id.toUpperCase()}</span>
            <span className="text-muted-foreground">{formatCurrency(price.last, price.last < 1 ? 4 : 2)}</span>
            <span className={cn("text-xs", price.changePercent24h >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")}>
              {formatPercent(price.changePercent24h)}
            </span>
          </button>
        ))}
      </div>

      {currentPrice && <MarketStats price={currentPrice} symbol={selectedAsset.toUpperCase()} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceChart data={history} title={`${selectedAsset.toUpperCase()} Price`} />
        </div>
        {currentPrice && <OrderBook price={currentPrice} decimals={currentPrice.last < 1 ? 6 : 2} />}
      </div>
    </div>
  );
}
