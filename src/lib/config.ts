export type ProviderChoice = 'simulator' | 'binance' | 'coinbase' | 'oanda' | 'kalshi';

export interface ExchangeCredentials {
  binance: { apiKey: string; secret: string; sandbox: boolean } | null;
  coinbase: { apiKey: string; secret: string; sandbox: boolean } | null;
  oanda: { apiKey: string; accountId: string; practice: boolean } | null;
  kalshi: { email: string; password: string; demo: boolean } | null;
}

export function getCryptoProvider(): ProviderChoice {
  const val = process.env.MARKET_CRYPTO_PROVIDER?.toLowerCase();
  if (val === 'binance' || val === 'coinbase') return val;
  return 'simulator';
}

export function getForexProvider(): ProviderChoice {
  const val = process.env.MARKET_FOREX_PROVIDER?.toLowerCase();
  if (val === 'oanda') return val;
  return 'simulator';
}

export function getKalshiProvider(): ProviderChoice {
  const val = process.env.MARKET_KALSHI_PROVIDER?.toLowerCase();
  if (val === 'kalshi') return val;
  return 'simulator';
}

export function getExchangeCredentials(): ExchangeCredentials {
  return {
    binance: process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET
      ? {
          apiKey: process.env.BINANCE_API_KEY,
          secret: process.env.BINANCE_SECRET,
          sandbox: process.env.BINANCE_SANDBOX !== 'false',
        }
      : null,
    coinbase: process.env.COINBASE_API_KEY && process.env.COINBASE_SECRET
      ? {
          apiKey: process.env.COINBASE_API_KEY,
          secret: process.env.COINBASE_SECRET,
          sandbox: process.env.COINBASE_SANDBOX !== 'false',
        }
      : null,
    oanda: process.env.OANDA_API_KEY && process.env.OANDA_ACCOUNT_ID
      ? {
          apiKey: process.env.OANDA_API_KEY,
          accountId: process.env.OANDA_ACCOUNT_ID,
          practice: process.env.OANDA_PRACTICE !== 'false',
        }
      : null,
    kalshi: process.env.KALSHI_EMAIL && process.env.KALSHI_PASSWORD
      ? {
          email: process.env.KALSHI_EMAIL,
          password: process.env.KALSHI_PASSWORD,
          demo: process.env.KALSHI_DEMO !== 'false',
        }
      : null,
  };
}

export function logProviderConfig(): void {
  console.log('[Config] Crypto provider:', getCryptoProvider());
  console.log('[Config] Forex provider:', getForexProvider());
  console.log('[Config] Kalshi provider:', getKalshiProvider());
  console.log('[Config] Polymarket: simulator (always)');
  console.log('[Config] Sports: simulator (always)');

  const creds = getExchangeCredentials();
  if (getCryptoProvider() === 'binance' && !creds.binance) {
    console.warn('[Config] WARNING: Binance selected but BINANCE_API_KEY/BINANCE_SECRET not set — falling back to simulator');
  }
  if (getCryptoProvider() === 'coinbase' && !creds.coinbase) {
    console.warn('[Config] WARNING: Coinbase selected but COINBASE_API_KEY/COINBASE_SECRET not set — falling back to simulator');
  }
  if (getForexProvider() === 'oanda' && !creds.oanda) {
    console.warn('[Config] WARNING: OANDA selected but OANDA_API_KEY/OANDA_ACCOUNT_ID not set — falling back to simulator');
  }
  if (getKalshiProvider() === 'kalshi' && !creds.kalshi) {
    console.warn('[Config] WARNING: Kalshi selected but KALSHI_EMAIL/KALSHI_PASSWORD not set — falling back to simulator');
  }
}
