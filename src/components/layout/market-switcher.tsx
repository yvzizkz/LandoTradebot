"use client";
import { useEffect, useState } from "react";
import { useMarketStore } from "@/stores/market-store";
import { MARKET_TYPES, MARKET_LABELS, MarketType } from "@/types/market";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bitcoin, DollarSign, BarChart3, TrendingUp, Trophy } from "lucide-react";

const MARKET_ICONS: Record<MarketType, React.ReactNode> = {
  crypto: <Bitcoin className="h-4 w-4" />,
  forex: <DollarSign className="h-4 w-4" />,
  kalshi: <BarChart3 className="h-4 w-4" />,
  polymarket: <TrendingUp className="h-4 w-4" />,
  sports: <Trophy className="h-4 w-4" />,
};

type ProviderInfo = Record<string, { exchangeId: string; isSimulator: boolean }>;

export function MarketSwitcher() {
  const { selectedMarket, setSelectedMarket } = useMarketStore();
  const [providers, setProviders] = useState<ProviderInfo>({});

  useEffect(() => {
    fetch("/api/config/providers")
      .then((res) => res.json())
      .then(setProviders)
      .catch(() => {});
  }, []);

  return (
    <Select value={selectedMarket} onValueChange={(v) => setSelectedMarket(v as MarketType)}>
      <SelectTrigger className="w-[220px]">
        <div className="flex items-center gap-2">
          {MARKET_ICONS[selectedMarket]}
          <SelectValue />
          {providers[selectedMarket] && (
            <Badge
              variant={providers[selectedMarket].isSimulator ? "secondary" : "default"}
              className="ml-1 text-[10px] px-1.5 py-0"
            >
              {providers[selectedMarket].isSimulator ? "Sim" : "Live"}
            </Badge>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {MARKET_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            <div className="flex items-center gap-2">
              {MARKET_ICONS[type]}
              {MARKET_LABELS[type]}
              {providers[type] && (
                <Badge
                  variant={providers[type].isSimulator ? "secondary" : "default"}
                  className="ml-1 text-[10px] px-1.5 py-0"
                >
                  {providers[type].isSimulator ? "Sim" : "Live"}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
