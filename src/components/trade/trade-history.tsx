"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";

export function TradeHistory() {
  const { tradeHistory } = usePortfolioStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        {tradeHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trades executed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Market</th>
                  <th className="pb-2 pr-4">Asset</th>
                  <th className="pb-2 pr-4">Side</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Price</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">{format(new Date(trade.timestamp), 'MM/dd HH:mm:ss')}</td>
                    <td className="py-2 pr-4">{trade.marketType}</td>
                    <td className="py-2 pr-4 font-medium">{trade.assetSymbol}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'} className="text-xs">
                        {trade.side.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{trade.type}</td>
                    <td className="py-2 pr-4 text-right">{trade.quantity}</td>
                    <td className="py-2 pr-4 text-right">{formatCurrency(trade.price, trade.price < 1 ? 6 : 2)}</td>
                    <td className="py-2 pr-4 text-right font-medium">{formatCurrency(trade.price * trade.quantity)}</td>
                    <td className="py-2 text-right">
                      <Badge variant={trade.status === 'filled' ? 'secondary' : 'destructive'} className="text-xs">
                        {trade.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
