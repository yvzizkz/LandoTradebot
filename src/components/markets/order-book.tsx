"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrentPrice } from "@/types/market";
import { formatCurrency, cn } from "@/lib/utils";

interface OrderBookProps {
  price: CurrentPrice;
  decimals?: number;
}

function generateOrderBookEntries(basePrice: number, side: 'bid' | 'ask', count: number = 8): { price: number; size: number; total: number }[] {
  const entries = [];
  let cumTotal = 0;
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * basePrice * 0.0005;
    const entryPrice = side === 'bid' ? basePrice - offset : basePrice + offset;
    const size = Math.random() * 10 + 0.5;
    cumTotal += size;
    entries.push({ price: entryPrice, size, total: cumTotal });
  }
  return entries;
}

export function OrderBook({ price, decimals = 2 }: OrderBookProps) {
  const bids = generateOrderBookEntries(price.bid, 'bid');
  const asks = generateOrderBookEntries(price.ask, 'ask');
  const maxTotal = Math.max(bids[bids.length - 1]?.total || 1, asks[asks.length - 1]?.total || 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground pb-1 border-b border-border">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          {asks.reverse().map((entry, i) => (
            <div key={`ask-${i}`} className="relative grid grid-cols-3 text-xs py-0.5">
              <div className="absolute right-0 top-0 h-full bg-[var(--color-negative)]/10" style={{ width: `${(entry.total / maxTotal) * 100}%` }} />
              <span className="relative text-[var(--color-negative)]">{formatCurrency(entry.price, decimals)}</span>
              <span className="relative text-right">{entry.size.toFixed(4)}</span>
              <span className="relative text-right text-muted-foreground">{entry.total.toFixed(4)}</span>
            </div>
          ))}
          <div className="grid grid-cols-3 py-1 text-xs font-bold border-y border-border">
            <span className={cn(price.changePercent24h >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]")}>
              {formatCurrency(price.last, decimals)}
            </span>
            <span className="text-right text-muted-foreground">Spread</span>
            <span className="text-right">{formatCurrency(price.ask - price.bid, decimals)}</span>
          </div>
          {bids.map((entry, i) => (
            <div key={`bid-${i}`} className="relative grid grid-cols-3 text-xs py-0.5">
              <div className="absolute right-0 top-0 h-full bg-[var(--color-positive)]/10" style={{ width: `${(entry.total / maxTotal) * 100}%` }} />
              <span className="relative text-[var(--color-positive)]">{formatCurrency(entry.price, decimals)}</span>
              <span className="relative text-right">{entry.size.toFixed(4)}</span>
              <span className="relative text-right text-muted-foreground">{entry.total.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
