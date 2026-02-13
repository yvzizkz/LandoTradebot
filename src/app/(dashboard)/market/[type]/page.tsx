"use client";
import { use } from "react";
import { useMarketData } from "@/hooks/use-market-data";
import { MARKET_LABELS, MarketType, MARKET_TYPES } from "@/types/market";
import { CryptoMarketView } from "@/components/markets/crypto/crypto-market-view";
import { ForexMarketView } from "@/components/markets/forex/forex-market-view";
import { KalshiMarketView } from "@/components/markets/kalshi/kalshi-market-view";
import { PolymarketView } from "@/components/markets/polymarket/polymarket-view";
import { SportsMarketView } from "@/components/markets/sports/sports-market-view";
import { notFound } from "next/navigation";

const MARKET_VIEWS: Record<MarketType, React.ComponentType> = {
  crypto: CryptoMarketView,
  forex: ForexMarketView,
  kalshi: KalshiMarketView,
  polymarket: PolymarketView,
  sports: SportsMarketView,
};

export default function MarketPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  useMarketData();

  if (!MARKET_TYPES.includes(type as MarketType)) {
    notFound();
  }

  const marketType = type as MarketType;
  const View = MARKET_VIEWS[marketType];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{MARKET_LABELS[marketType]}</h1>
        <p className="text-sm text-muted-foreground">Real-time {MARKET_LABELS[marketType].toLowerCase()} market data and analysis</p>
      </div>
      <View />
    </div>
  );
}
