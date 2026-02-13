"use client";
import { useMarketStore } from "@/stores/market-store";
import { MARKET_TYPES, MARKET_LABELS, MarketType } from "@/types/market";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bitcoin, DollarSign, BarChart3, TrendingUp, Trophy } from "lucide-react";

const MARKET_ICONS: Record<MarketType, React.ReactNode> = {
  crypto: <Bitcoin className="h-4 w-4" />,
  forex: <DollarSign className="h-4 w-4" />,
  kalshi: <BarChart3 className="h-4 w-4" />,
  polymarket: <TrendingUp className="h-4 w-4" />,
  sports: <Trophy className="h-4 w-4" />,
};

export function MarketSwitcher() {
  const { selectedMarket, setSelectedMarket } = useMarketStore();

  return (
    <Select value={selectedMarket} onValueChange={(v) => setSelectedMarket(v as MarketType)}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          {MARKET_ICONS[selectedMarket]}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {MARKET_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            <div className="flex items-center gap-2">
              {MARKET_ICONS[type]}
              {MARKET_LABELS[type]}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
