import { create } from 'zustand';
import { MarketType, CurrentPrice } from '@/types/market';

interface MarketState {
  selectedMarket: MarketType;
  priceData: Record<MarketType, Record<string, CurrentPrice>>;
  setSelectedMarket: (market: MarketType) => void;
  updatePrices: (market: MarketType, prices: Record<string, CurrentPrice>) => void;
  updatePrice: (market: MarketType, assetId: string, price: CurrentPrice) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  selectedMarket: 'crypto',
  priceData: {
    crypto: {},
    forex: {},
    kalshi: {},
    polymarket: {},
    sports: {},
  },
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  updatePrices: (market, prices) =>
    set((state) => ({
      priceData: {
        ...state.priceData,
        [market]: { ...state.priceData[market], ...prices },
      },
    })),
  updatePrice: (market, assetId, price) =>
    set((state) => ({
      priceData: {
        ...state.priceData,
        [market]: { ...state.priceData[market], [assetId]: price },
      },
    })),
}));
