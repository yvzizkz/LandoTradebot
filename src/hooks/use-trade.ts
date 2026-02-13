"use client";
import { useState } from 'react';
import { MarketType } from '@/types/market';
import { OrderSide, OrderType } from '@/types/trade';

interface TradeParams {
  marketType: MarketType;
  assetId: string;
  assetSymbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
}

export function useTrade() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const submitTrade = async (params: TradeParams) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await res.json();
      setLastResult({ success: result.success, message: result.message });
      return result;
    } catch {
      setLastResult({ success: false, message: 'Network error' });
      return { success: false, message: 'Network error' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitTrade, isSubmitting, lastResult };
}
