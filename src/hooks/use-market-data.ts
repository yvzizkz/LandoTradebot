"use client";
import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/stores/market-store';
import { StreamUpdate } from '@/lib/websocket/market-stream';

export function useMarketData() {
  const updatePrices = useMarketStore((s) => s.updatePrices);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/ws');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const updates: StreamUpdate[] = JSON.parse(event.data);
        for (const update of updates) {
          updatePrices(update.marketType, update.prices);
        }
      } catch {
        // Skip malformed messages
      }
    };

    es.onerror = () => {
      // EventSource automatically reconnects
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [updatePrices]);
}
