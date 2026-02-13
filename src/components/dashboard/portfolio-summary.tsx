"use client";
import { Card, CardContent } from "@/components/ui/card";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";

export function PortfolioSummary() {
  const { totalValue, cashBalance, totalPnl, totalPnlPercent, dailyPnl, dailyPnlPercent, positions } =
    usePortfolioStore();

  const cards = [
    {
      title: "Total Portfolio",
      value: formatCurrency(totalValue),
      change: formatPercent(totalPnlPercent),
      isPositive: totalPnl >= 0,
      icon: Wallet,
    },
    {
      title: "Total P&L",
      value: formatCurrency(totalPnl),
      change: formatPercent(totalPnlPercent),
      isPositive: totalPnl >= 0,
      icon: totalPnl >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: "Daily P&L",
      value: formatCurrency(dailyPnl),
      change: formatPercent(dailyPnlPercent),
      isPositive: dailyPnl >= 0,
      icon: dailyPnl >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: "Cash Balance",
      value: formatCurrency(cashBalance),
      change: `${positions.length} positions`,
      isPositive: true,
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <card.icon className={cn("h-4 w-4", card.isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")} />
            </div>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className={cn("mt-1 text-xs", card.isPositive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")}>
              {card.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
