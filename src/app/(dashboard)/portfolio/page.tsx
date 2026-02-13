"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { useMarketData } from "@/hooks/use-market-data";
import { usePortfolio } from "@/hooks/use-portfolio";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { MARKET_LABELS, MarketType } from "@/types/market";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export default function PortfolioPage() {
  useMarketData();
  usePortfolio();
  const { positions, marketBreakdown, cashBalance } = usePortfolioStore();

  const pieData = marketBreakdown
    .filter((m) => m.value > 0)
    .map((m) => ({ name: MARKET_LABELS[m.marketType], value: m.value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Track your positions and performance across all markets</p>
      </div>

      <PortfolioSummary />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PnlChart />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Market Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                      formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No positions yet
              </div>
            )}
            <div className="mt-2 space-y-1">
              {marketBreakdown.map((m, i) => (
                <div key={m.marketType} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{MARKET_LABELS[m.marketType]}</span>
                  </div>
                  <span>{m.positionCount} positions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open positions. Place a trade to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Market</th>
                    <th className="pb-2 pr-4">Asset</th>
                    <th className="pb-2 pr-4">Side</th>
                    <th className="pb-2 pr-4 text-right">Qty</th>
                    <th className="pb-2 pr-4 text-right">Entry Price</th>
                    <th className="pb-2 pr-4 text-right">Current Price</th>
                    <th className="pb-2 pr-4 text-right">P&L</th>
                    <th className="pb-2 text-right">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.id} className="border-b border-border/50">
                      <td className="py-2 pr-4">{MARKET_LABELS[pos.marketType]}</td>
                      <td className="py-2 pr-4 font-medium">{pos.assetSymbol}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={pos.side === 'buy' ? 'default' : 'destructive'} className="text-xs">{pos.side.toUpperCase()}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-right">{pos.quantity}</td>
                      <td className="py-2 pr-4 text-right">{formatCurrency(pos.entryPrice, pos.entryPrice < 1 ? 6 : 2)}</td>
                      <td className="py-2 pr-4 text-right">{formatCurrency(pos.currentPrice, pos.currentPrice < 1 ? 6 : 2)}</td>
                      <td className={cn("py-2 pr-4 text-right font-medium", pos.unrealizedPnl >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")}>
                        {formatCurrency(pos.unrealizedPnl)}
                      </td>
                      <td className={cn("py-2 text-right", pos.unrealizedPnlPercent >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")}>
                        {formatPercent(pos.unrealizedPnlPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
