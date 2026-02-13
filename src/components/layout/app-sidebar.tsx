"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LineChart,
  ArrowRightLeft,
  Wallet,
  Brain,
  Bitcoin,
  DollarSign,
  BarChart3,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MarketType, MARKET_LABELS } from "@/types/market";

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trade", label: "Trade", icon: ArrowRightLeft },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/ai-analysis", label: "AI Analysis", icon: Brain },
];

const marketNavItems: { type: MarketType; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "crypto", icon: Bitcoin },
  { type: "forex", icon: DollarSign },
  { type: "kalshi", icon: BarChart3 },
  { type: "polymarket", icon: TrendingUp },
  { type: "sports", icon: Trophy },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-sidebar-foreground">MoltBolt</span>
        <span className="text-xs text-muted-foreground">TraderBot</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4" />

        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Markets
        </div>
        <nav className="flex flex-col gap-1">
          {marketNavItems.map(({ type, icon: Icon }) => {
            const href = `/market/${type}`;
            const isActive = pathname === href;
            return (
              <Link
                key={type}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {MARKET_LABELS[type]}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          Simulated Mode
        </div>
      </div>
    </aside>
  );
}
