import { Currency } from '../types';

// Exchange rates relative to USD (base currency)
// These are approximate rates and should be updated via API
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  AUD: 1.35,
  CAD: 1.25,
  CHF: 0.92,
  CNY: 6.45,
  INR: 75.0,
  KRW: 1100.0,
  SGD: 1.35,
  HKD: 7.75,
  MXN: 20.0,
  BRL: 5.5,
  ZAR: 15.0,
  RUB: 75.0,
  TRY: 8.5,
  PLN: 3.8,
  SEK: 8.5,
  NOK: 8.8
};

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const key = `${fromCurrency}_${toCurrency}`;
    
    // Check cache first
    const cached = this.exchangeRates.get(key);
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached.rate;
    }

    // Try to fetch from API
    try {
      const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
      this.exchangeRates.set(key, {
        from: fromCurrency,
        to: toCurrency,
        rate,
        lastUpdated: new Date()
      });
      return rate;
    } catch (error) {
      console.warn('Failed to fetch exchange rate, using fallback:', error);
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Fetch exchange rate from external API
   */
  private async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Use a free exchange rate API
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    const data = await response.json();
    return data.rates[toCurrency] || this.getFallbackRate(fromCurrency, toCurrency);
  }

  /**
   * Get fallback exchange rate from hardcoded values
   */
  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;
    return toRate / fromRate;
  }

  /**
   * Check if cached exchange rate is still valid
   */
  private isCacheValid(lastUpdated: Date): boolean {
    if (!this.lastFetchTime) return false;
    return (new Date().getTime() - lastUpdated.getTime()) < this.CACHE_DURATION;
  }

  /**
   * Convert multiple currencies to a base currency (USD)
   */
  async convertToBaseCurrency(
    amounts: Array<{ amount: number; currency: string }>,
    baseCurrency: string = 'USD'
  ): Promise<number> {
    let totalInBase = 0;

    for (const { amount, currency } of amounts) {
      if (currency === baseCurrency) {
        totalInBase += amount;
      } else {
        const converted = await this.convertCurrency(amount, currency, baseCurrency);
        totalInBase += converted;
      }
    }

    return totalInBase;
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): Currency[] {
    return Object.entries(EXCHANGE_RATES).map(([code, rate]) => ({
      code,
      symbol: this.getCurrencySymbol(code),
      name: this.getCurrencyName(code),
      exchangeRate: rate
    }));
  }

  /**
   * Get currency symbol
   */
  private getCurrencySymbol(code: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      CHF: 'CHF',
      CNY: '¥',
      INR: '₹',
      KRW: '₩',
      SGD: 'S$',
      HKD: 'HK$',
      MXN: '$',
      BRL: 'R$',
      ZAR: 'R',
      RUB: '₽',
      TRY: '₺',
      PLN: 'zł',
      SEK: 'kr',
      NOK: 'kr'
    };
    return symbols[code] || code;
  }

  /**
   * Get currency name
   */
  private getCurrencyName(code: string): string {
    const names: Record<string, string> = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      AUD: 'Australian Dollar',
      CAD: 'Canadian Dollar',
      CHF: 'Swiss Franc',
      CNY: 'Chinese Yuan',
      INR: 'Indian Rupee',
      KRW: 'South Korean Won',
      SGD: 'Singapore Dollar',
      HKD: 'Hong Kong Dollar',
      MXN: 'Mexican Peso',
      BRL: 'Brazilian Real',
      ZAR: 'South African Rand',
      RUB: 'Russian Ruble',
      TRY: 'Turkish Lira',
      PLN: 'Polish Zloty',
      SEK: 'Swedish Krona',
      NOK: 'Norwegian Krone'
    };
    return names[code] || code;
  }

  /**
   * Format currency amount with proper symbol and decimals
   */
  formatCurrency(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    const decimals = this.getCurrencyDecimals(currency);
    
    return `${symbol}${amount.toFixed(decimals)}`;
  }

  /**
   * Get number of decimal places for currency
   */
  private getCurrencyDecimals(currency: string): number {
    // Most currencies use 2 decimal places
    const zeroDecimals = ['JPY', 'KRW'];
    return zeroDecimals.includes(currency) ? 0 : 2;
  }
}

export default CurrencyService; 