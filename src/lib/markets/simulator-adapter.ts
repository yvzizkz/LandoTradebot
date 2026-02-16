import {
  BaseAsset,
  CurrentPrice,
  PricePoint,
  MarketDataProvider,
  ExchangeProvider,
  ExchangeOrderParams,
  ExchangeOrderResult,
  ExchangeOrderStatus,
  MarketType,
} from '@/types/market';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wraps existing sync MarketDataProvider simulators into the async ExchangeProvider interface.
 * All existing simulator code stays untouched.
 */
export class SimulatorAdapter<T extends BaseAsset = BaseAsset> implements ExchangeProvider<T> {
  marketType: MarketType;
  exchangeId = 'simulator';
  isSimulator = true;

  private simulator: MarketDataProvider<T>;

  constructor(simulator: MarketDataProvider<T>) {
    this.simulator = simulator;
    this.marketType = simulator.marketType;
  }

  async initialize(): Promise<void> {
    // Simulators need no async initialization
  }

  async destroy(): Promise<void> {
    // Nothing to clean up
  }

  async getAssets(): Promise<T[]> {
    return this.simulator.getAssets();
  }

  async getAsset(id: string): Promise<T | undefined> {
    return this.simulator.getAsset(id);
  }

  async getCurrentPrice(assetId: string): Promise<CurrentPrice> {
    return this.simulator.getCurrentPrice(assetId);
  }

  async getPriceHistory(assetId: string, periods: number): Promise<PricePoint[]> {
    return this.simulator.getPriceHistory(assetId, periods);
  }

  async placeOrder(params: ExchangeOrderParams): Promise<ExchangeOrderResult> {
    const price = this.simulator.getCurrentPrice(params.assetId);
    const fillPrice = params.side === 'buy' ? price.ask : price.bid;

    // For limit orders, check price acceptability
    if (params.type === 'limit' && params.limitPrice !== undefined) {
      if (params.side === 'buy' && fillPrice > params.limitPrice) {
        return {
          exchangeOrderId: uuidv4(),
          status: 'rejected',
          filledQty: 0,
          avgFillPrice: 0,
          fee: 0,
          feeCurrency: 'USD',
        };
      }
      if (params.side === 'sell' && fillPrice < params.limitPrice) {
        return {
          exchangeOrderId: uuidv4(),
          status: 'rejected',
          filledQty: 0,
          avgFillPrice: 0,
          fee: 0,
          feeCurrency: 'USD',
        };
      }
    }

    // Simulate instant fill with a small fee
    const fee = fillPrice * params.quantity * 0.001; // 0.1% fee
    return {
      exchangeOrderId: uuidv4(),
      status: 'filled',
      filledQty: params.quantity,
      avgFillPrice: fillPrice,
      fee,
      feeCurrency: 'USD',
    };
  }

  async getOrderStatus(exchangeOrderId: string): Promise<ExchangeOrderStatus> {
    // Simulator orders fill instantly
    return {
      exchangeOrderId,
      status: 'filled',
      filledQty: 0,
      avgFillPrice: 0,
      fee: 0,
    };
  }

  async cancelOrder(_exchangeOrderId: string): Promise<boolean> {
    // Simulator orders fill instantly, nothing to cancel
    return false;
  }

  async tick(): Promise<Map<string, CurrentPrice>> {
    return this.simulator.tick();
  }
}
