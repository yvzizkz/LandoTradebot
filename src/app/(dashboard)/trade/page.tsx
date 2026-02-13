"use client";
import { TradeForm } from "@/components/trade/trade-form";
import { TradeHistory } from "@/components/trade/trade-history";
import { useMarketData } from "@/hooks/use-market-data";
import { usePortfolio } from "@/hooks/use-portfolio";

export default function TradePage() {
  useMarketData();
  usePortfolio();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trade</h1>
        <p className="text-sm text-muted-foreground">Place simulated trades across all markets</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TradeForm />
        </div>
        <div className="lg:col-span-2">
          <TradeHistory />
        </div>
      </div>
    </div>
  );
}
