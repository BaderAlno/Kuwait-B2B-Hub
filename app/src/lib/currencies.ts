// ─── Currency Configuration ───────────────────────────────────────────────────

export interface CurrencyConfig {
  code: string;          // ISO 4217
  symbol: string;        // Display symbol
  name: string;          // Full name
  decimals: number;      // Decimal places
  country: string;       // Country name
  flag: string;          // Emoji flag
  locale: string;        // Intl locale
  vatRate: number;       // VAT rate (0.0 – 1.0)
  phonePrefix: string;   // International dialing code
  dateFormat: string;    // Display hint
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  KWD: {
    code: 'KWD', symbol: 'KD',  name: 'Kuwaiti Dinar',  decimals: 3,
    country: 'Kuwait',       flag: '🇰🇼', locale: 'en-KW',
    vatRate: 0,    phonePrefix: '+965', dateFormat: 'DD/MM/YYYY',
  },
  SAR: {
    code: 'SAR', symbol: 'SR',  name: 'Saudi Riyal',    decimals: 2,
    country: 'Saudi Arabia', flag: '🇸🇦', locale: 'en-SA',
    vatRate: 0.15, phonePrefix: '+966', dateFormat: 'DD/MM/YYYY',
  },
  AED: {
    code: 'AED', symbol: 'AED', name: 'UAE Dirham',     decimals: 2,
    country: 'UAE',          flag: '🇦🇪', locale: 'en-AE',
    vatRate: 0.05, phonePrefix: '+971', dateFormat: 'DD/MM/YYYY',
  },
  BHD: {
    code: 'BHD', symbol: 'BD',  name: 'Bahraini Dinar', decimals: 3,
    country: 'Bahrain',      flag: '🇧🇭', locale: 'en-BH',
    vatRate: 0.10, phonePrefix: '+973', dateFormat: 'DD/MM/YYYY',
  },
};

// Exchange rates relative to KWD (base currency)
export const EXCHANGE_RATES: Record<string, number> = {
  KWD: 1,
  SAR: 12.20,
  AED: 11.95,
  BHD: 1.03,
};

export const DEFAULT_CURRENCY = 'KWD';

/** Convert a KWD price to target currency */
export function convertPrice(kwdAmount: number, toCurrency: string): number {
  const rate = EXCHANGE_RATES[toCurrency] ?? 1;
  return kwdAmount * rate;
}

/** Format a price in the given currency */
export function formatPrice(kwdAmount: number, currencyCode: string): string {
  const cfg = CURRENCIES[currencyCode];
  if (!cfg) return `KD ${kwdAmount.toFixed(3)}`;
  const converted = convertPrice(kwdAmount, currencyCode);
  return `${cfg.symbol} ${converted.toFixed(cfg.decimals)}`;
}

/** Format a price with VAT included */
export function formatPriceWithVAT(kwdAmount: number, currencyCode: string): string {
  const cfg = CURRENCIES[currencyCode];
  if (!cfg) return formatPrice(kwdAmount, currencyCode);
  const converted = convertPrice(kwdAmount, currencyCode);
  const withVAT = converted * (1 + cfg.vatRate);
  return `${cfg.symbol} ${withVAT.toFixed(cfg.decimals)}`;
}

/** Format a price for admin views — always KWD, 3 decimal places, never converts */
export function formatAdminPrice(amountInKWD: number): string {
  return `KD ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amountInKWD)}`;
}

export const GCC_MARKETS = ['KWD', 'SAR', 'AED', 'BHD'] as const;
