import { create } from 'zustand';
import { MarketType } from '@/types/market';
import { OrderSide, OrderType } from '@/types/trade';

interface TradeFormState {
  marketType: MarketType;
  assetId: string;
  assetSymbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: string;
  limitPrice: string;
  isSubmitting: boolean;
  setField: (field: Partial<TradeFormState>) => void;
  reset: () => void;
}

const initialState = {
  marketType: 'crypto' as MarketType,
  assetId: '',
  assetSymbol: '',
  side: 'buy' as OrderSide,
  orderType: 'market' as OrderType,
  quantity: '',
  limitPrice: '',
  isSubmitting: false,
};

export const useTradeStore = create<TradeFormState>((set) => ({
  ...initialState,
  setField: (field) => set((state) => ({ ...state, ...field })),
  reset: () => set(initialState),
}));
