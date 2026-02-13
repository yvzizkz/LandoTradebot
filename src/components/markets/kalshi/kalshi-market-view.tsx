"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMarketStore } from "@/stores/market-store";
import { cn } from "@/lib/utils";

interface KalshiAsset {
  id: string;
  symbol: string;
  name: string;
  eventTitle: string;
  category: string;
  expirationDate: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  status: string;
}

export function KalshiMarketView() {
  const { priceData } = useMarketStore();
  const [assets, setAssets] = useState<KalshiAsset[]>([]);

  useEffect(() => {
    fetch('/api/markets/kalshi')
      .then((r) => r.json())
      .then((data) => { if (data.assets) setAssets(data.assets); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {assets.map((contract) => {
        const livePrice = priceData.kalshi?.[contract.id];
        const yesPrice = livePrice ? livePrice.last : contract.yesPrice;
        const noPrice = 100 - yesPrice;

        return (
          <Card key={contract.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{contract.eventTitle}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{contract.category}</Badge>
                    <span className="text-xs text-muted-foreground">Expires: {contract.expirationDate}</span>
                  </div>
                </div>
                <Badge variant={contract.status === 'open' ? 'default' : 'secondary'}>{contract.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-positive)]">Yes</span>
                    <span className="text-lg font-bold">{Math.round(yesPrice)}c</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{Math.round(noPrice)}c</span>
                    <span className="text-sm font-medium text-[var(--color-negative)]">No</span>
                  </div>
                </div>
                <Progress value={yesPrice} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Vol: {contract.volume.toLocaleString()}</span>
                  <span>{contract.symbol}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {assets.length === 0 && <p className="text-sm text-muted-foreground">Loading Kalshi contracts...</p>}
    </div>
  );
}
