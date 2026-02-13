"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";

export function RecentTrades() {
  const { tradeHistory } = usePortfolioStore();
  const recentTrades = tradeHistory.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTrades.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trades yet. Place your first trade!</p>
        ) : (
          <div className="space-y-2">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'} className="text-xs w-12 justify-center">
                    {trade.side.toUpperCase()}
                  </Badge>
                  <div>
                    <span className="font-medium">{trade.assetSymbol}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{trade.marketType}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(trade.price * trade.quantity)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(trade.timestamp), 'HH:mm:ss')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
