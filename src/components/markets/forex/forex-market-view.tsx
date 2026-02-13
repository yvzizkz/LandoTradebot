"use client";
import { useEffect, useState } from "react";
import { PriceChart } from "@/components/markets/price-chart";
import { MarketStats } from "@/components/markets/market-stats";
import { OrderBook } from "@/components/markets/order-book";
import { useMarketStore } from "@/stores/market-store";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { PricePoint } from "@/types/market";

export function ForexMarketView() {
  const { priceData } = useMarketStore();
  const prices = priceData.forex || {};
  const [selectedPair, setSelectedPair] = useState<string>("eurusd");
  const [history, setHistory] = useState<PricePoint[]>([]);

  useEffect(() => {
    fetch(`/api/markets/forex`)
      .then((r) => r.json())
      .then((data) => {
        const asset = data.assets?.find((a: { id: string }) => a.id === selectedPair);
        if (asset?.history) setHistory(asset.history);
      })
      .catch(() => {});
  }, [selectedPair]);

  const currentPrice = prices[selectedPair];
  const entries = Object.entries(prices);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {entries.map(([id, price]) => (
          <button key={id} onClick={() => setSelectedPair(id)}
            className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              id === selectedPair ? "border-primary bg-primary/10" : "border-border hover:bg-accent")}>
            <span className="font-semibold">{id.toUpperCase()}</span>
            <span className="text-muted-foreground">{formatCurrency(price.last, 4)}</span>
            <span className={cn("text-xs", price.changePercent24h >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")}>
              {formatPercent(price.changePercent24h)}
            </span>
          </button>
        ))}
      </div>
      {currentPrice && <MarketStats price={currentPrice} symbol={selectedPair.toUpperCase()} />}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceChart data={history} title={`${selectedPair.toUpperCase()} Price`} color="var(--chart-3)" />
        </div>
        {currentPrice && <OrderBook price={currentPrice} decimals={4} />}
      </div>
    </div>
  );
}
