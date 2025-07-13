import { Currency } from '../types/index';

class CurrencyConverter {
  private apiKey: string;
  private baseUrl: string = 'https://api.exchangerate.host';
  private ratesCache: { [date: string]: { [from: string]: { [to: string]: number } } } = {};
  private supportedCurrencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', exchangeRate: 83.5 },
    // Add more
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getExchangeRate(from: string, to: string, date?: Date): Promise<number> {
    const dateStr = date ? date.toISOString().split('T')[0] : 'latest';

    if (this.ratesCache[dateStr]?.[from]?.[to]) {
      return this.ratesCache[dateStr][from][to];
    }

    try {
      const url = date 
        ? `${this.baseUrl}/historical?access_key=${this.apiKey}&date=${dateStr}&base=${from}&currencies=${to}` 
        : `${this.baseUrl}/latest?access_key=${this.apiKey}&base=${from}&currencies=${to}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.info);
      }

      const rate = data.rates[to];

      if (!this.ratesCache[dateStr]) this.ratesCache[dateStr] = {};
      if (!this.ratesCache[dateStr][from]) this.ratesCache[dateStr][from] = {};
      this.ratesCache[dateStr][from][to] = rate;

      return rate;
    } catch (error) {
      console.error('Currency conversion error:', error);
      return this.getFallbackRate(from, to);
    }
  }

  private getFallbackRate(from: string, to: string): number {
    const fromRate = this.supportedCurrencies.find(c => c.code === from)?.exchangeRate || 1;
    const toRate = this.supportedCurrencies.find(c => c.code === to)?.exchangeRate || 1;
    return toRate / fromRate;
  }

  async convertAmount(amount: number, from: string, to: string, date?: Date): Promise<number> {
    const rate = await this.getExchangeRate(from, to, date);
    return amount * rate;
  }

  getSymbol(code: string): string {
    return this.supportedCurrencies.find(c => c.code === code)?.symbol || '$';
  }

  formatAmount(amount: number, currency: string): string {
    const symbol = this.getSymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export default CurrencyConverter; 