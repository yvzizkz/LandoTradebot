"use client";
import { MarketSwitcher } from "./market-switcher";
import { PriceTicker } from "@/components/markets/price-ticker";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <MarketSwitcher />
      </div>
      <PriceTicker />
    </header>
  );
}
