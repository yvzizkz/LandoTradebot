"use client";
import { useEffect } from "react";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { AiInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { useMarketData } from "@/hooks/use-market-data";
import { usePortfolio } from "@/hooks/use-portfolio";

export default function DashboardPage() {
  useMarketData();
  const { refreshPortfolio } = usePortfolio();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Multi-market overview and portfolio performance</p>
      </div>

      <PortfolioSummary />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PnlChart />
        </div>
        <AiInsightsPanel />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Markets</h2>
        <MarketOverview />
      </div>

      <RecentTrades />
    </div>
  );
}
