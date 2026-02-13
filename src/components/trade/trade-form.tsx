"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketStore } from "@/stores/market-store";
import { useTrade } from "@/hooks/use-trade";
import { usePortfolio } from "@/hooks/use-portfolio";
import { MARKET_TYPES, MARKET_LABELS, MarketType } from "@/types/market";
import { OrderSide, OrderType } from "@/types/trade";
import { formatCurrency, cn } from "@/lib/utils";

interface AssetOption {
  id: string;
  symbol: string;
  name: string;
}

export function TradeForm() {
  const { priceData, selectedMarket } = useMarketStore();
  const { submitTrade, isSubmitting, lastResult } = useTrade();
  const { refreshPortfolio } = usePortfolio();

  const [marketType, setMarketType] = useState<MarketType>(selectedMarket);
  const [assetId, setAssetId] = useState("");
  const [side, setSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [assets, setAssets] = useState<AssetOption[]>([]);

  useEffect(() => {
    fetch(`/api/markets/${marketType}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.assets) {
          const opts = data.assets.map((a: AssetOption) => ({ id: a.id, symbol: a.symbol, name: a.name }));
          setAssets(opts);
          if (opts.length > 0 && !assetId) setAssetId(opts[0].id);
        }
      })
      .catch(() => {});
  }, [marketType]);

  const currentPrice = assetId ? priceData[marketType]?.[assetId] : null;
  const selectedAsset = assets.find((a) => a.id === assetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !quantity || !selectedAsset) return;

    await submitTrade({
      marketType,
      assetId,
      assetSymbol: selectedAsset.symbol,
      side,
      type: orderType,
      quantity: parseFloat(quantity),
      limitPrice: orderType === "limit" ? parseFloat(limitPrice) : undefined,
    });

    setQuantity("");
    setLimitPrice("");
    refreshPortfolio();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Place Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Market</Label>
              <Select value={marketType} onValueChange={(v) => { setMarketType(v as MarketType); setAssetId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARKET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{MARKET_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.symbol} - {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant={side === "buy" ? "default" : "outline"} className={cn("flex-1", side === "buy" && "bg-[var(--color-positive)] hover:bg-[var(--color-positive)]/90")} onClick={() => setSide("buy")}>
              Buy
            </Button>
            <Button type="button" variant={side === "sell" ? "default" : "outline"} className={cn("flex-1", side === "sell" && "bg-[var(--color-negative)] hover:bg-[var(--color-negative)]/90")} onClick={() => setSide("sell")}>
              Sell
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" step="any" min="0" placeholder="0.00" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>

          {orderType === "limit" && (
            <div className="space-y-2">
              <Label>Limit Price</Label>
              <Input type="number" step="any" min="0" placeholder="0.00" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
            </div>
          )}

          {currentPrice && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-medium">{formatCurrency(currentPrice.last, currentPrice.last < 1 ? 6 : 2)}</span>
              </div>
              {quantity && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Est. Total</span>
                  <span className="font-medium">{formatCurrency(currentPrice.last * parseFloat(quantity || "0"))}</span>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || !assetId || !quantity}>
            {isSubmitting ? "Executing..." : `${side === "buy" ? "Buy" : "Sell"} ${selectedAsset?.symbol || ""}`}
          </Button>

          {lastResult && (
            <div className={cn("rounded-lg p-3 text-sm", lastResult.success ? "bg-[var(--color-positive)]/10 text-[var(--color-positive)]" : "bg-[var(--color-negative)]/10 text-[var(--color-negative)]")}>
              {lastResult.message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
