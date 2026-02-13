"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarketStore } from "@/stores/market-store";
import { formatPercent } from "@/lib/utils";

interface PolyAsset {
  id: string;
  symbol: string;
  question: string;
  category: string;
  endDate: string;
  outcomes: { id: string; label: string; price: number; volume: number }[];
  totalVolume: number;
  liquidity: number;
  resolved: boolean;
}

export function PolymarketView() {
  const { priceData } = useMarketStore();
  const [assets, setAssets] = useState<PolyAsset[]>([]);

  useEffect(() => {
    fetch('/api/markets/polymarket')
      .then((r) => r.json())
      .then((data) => { if (data.assets) setAssets(data.assets); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {assets.map((contract) => (
        <Card key={contract.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">{contract.question}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{contract.category}</Badge>
                  <span className="text-xs text-muted-foreground">Ends: {contract.endDate}</span>
                </div>
              </div>
              <Badge variant={contract.resolved ? 'secondary' : 'default'}>
                {contract.resolved ? 'Resolved' : 'Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contract.outcomes.map((outcome) => (
                <div key={outcome.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                  <span className="text-sm font-medium">{outcome.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${outcome.price * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{(outcome.price * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Volume: ${(contract.totalVolume / 1_000_000).toFixed(1)}M</span>
                <span>Liquidity: ${(contract.liquidity / 1_000_000).toFixed(1)}M</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {assets.length === 0 && <p className="text-sm text-muted-foreground">Loading Polymarket contracts...</p>}
    </div>
  );
}
