"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";

export function PnlChart() {
  const { snapshots } = usePortfolioStore();

  const chartData = snapshots.map((s) => ({
    time: format(new Date(s.timestamp), 'HH:mm'),
    value: s.totalValue,
  }));

  const minValue = Math.min(...snapshots.map((s) => s.totalValue)) * 0.999;
  const maxValue = Math.max(...snapshots.map((s) => s.totalValue)) * 1.001;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={[minValue, maxValue]} tickFormatter={(v) => formatCurrency(v, 0)} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  formatter={(value) => [formatCurrency(value as number), 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Portfolio chart will appear as data accumulates
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
