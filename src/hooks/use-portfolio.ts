"use client";
import { useEffect, useCallback } from 'react';
import { usePortfolioStore } from '@/stores/portfolio-store';

export function usePortfolio() {
  const store = usePortfolioStore();

  const refreshPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        store.updatePortfolio(data);
      }
    } catch {
      // Silently fail
    }
  }, [store]);

  useEffect(() => {
    refreshPortfolio();
    const interval = setInterval(refreshPortfolio, 5000);
    return () => clearInterval(interval);
  }, [refreshPortfolio]);

  return { ...store, refreshPortfolio };
}
