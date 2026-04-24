export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketData {
  symbol: string;
  candles: Candle[];
  currentPrice: number;
}

class MarketDataService {
  private readonly BINANCE_API = 'https://api.binance.com/api/v3';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';

  // List of coins to monitor
  private readonly COINS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT',
    'LINKUSDT', 'ATOMUSDT', 'LTCUSDT', 'UNIUSDT', 'NEARUSDT'
  ];

  /**
   * Fetch OHLCV candles from Binance
   */
  async fetchCandles(symbol: string, interval: string = '1h', limit: number = 200): Promise<Candle[]> {
    try {
      const response = await fetch(
        `${this.BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      const data = await response.json() as any[][];

      return data.map((k: any[]) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));
    } catch (error) {
      console.error(`Error fetching candles for ${symbol}:`, error);
      // Fallback to mock data for development
      return this.generateMockCandles(symbol);
    }
  }

  /**
   * Fetch current price from Binance
   */
  async fetchCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.BINANCE_API}/ticker/price?symbol=${symbol}`);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      const data = await response.json() as { price: string };
      return parseFloat(data.price);
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Fetch market data for multiple coins
   */
  async fetchMarketData(interval: string = '1h'): Promise<MarketData[]> {
    const promises = this.COINS.map(async (symbol) => {
      const candles = await this.fetchCandles(symbol, interval);
      const currentPrice = await this.fetchCurrentPrice(symbol);

      return {
        symbol,
        candles,
        currentPrice
      };
    });

    return Promise.all(promises);
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }

    return ema;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(candles: Candle[], period: number = 14): number {
    if (candles.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = candles.length - period; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate Volume Average
   */
  calculateVolumeAverage(candles: Candle[], period: number = 20): number {
    if (candles.length < period) return 0;

    const recent = candles.slice(-period);
    const sum = recent.reduce((acc, c) => acc + c.volume, 0);
    return sum / period;
  }

  /**
   * Generate mock candles for development/fallback
   */
  private generateMockCandles(symbol: string): Candle[] {
    const candles: Candle[] = [];
    const basePrice = symbol.includes('BTC') ? 65000 : symbol.includes('ETH') ? 3500 : 100;
    const now = Date.now();
    const interval = 60 * 60 * 1000; // 1 hour

    let price = basePrice;

    for (let i = 200; i > 0; i--) {
      const change = (Math.random() - 0.5) * (basePrice * 0.02);
      price = Math.max(price + change, basePrice * 0.8);

      candles.push({
        time: now - (i * interval),
        open: price,
        high: price * (1 + Math.random() * 0.01),
        low: price * (1 - Math.random() * 0.01),
        close: price * (1 + (Math.random() - 0.5) * 0.005),
        volume: Math.random() * 1000000 + 500000
      });
    }

    return candles;
  }

  /**
   * Get list of monitored coins
   */
  getCoins(): string[] {
    return this.COINS;
  }

  // ============================================================================
  // COINGECKO INTEGRATION - Free tier, more coins
  // ============================================================================

  /**
   * Fetch top coins by market cap from CoinGecko
   */
  async fetchTopCoins(limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h,7d,30d`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching top coins:', error);
      return [];
    }
  }

  /**
   * Fetch trending coins from CoinGecko
   */
  async fetchTrendingCoins(): Promise<any[]> {
    try {
      const response = await fetch(`${this.COINGECKO_API}/search/trending`);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.coins || [];
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return [];
    }
  }

  /**
   * Fetch detailed coin data including description, links, etc.
   */
  async fetchCoinDetails(coinId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching details for ${coinId}:`, error);
      return null;
    }
  }

  /**
   * Fetch historical price data for accumulation zone calculation
   */
  async fetchMarketChart(coinId: string, days: number = 90): Promise<any> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching chart for ${coinId}:`, error);
      return null;
    }
  }

  /**
   * Calculate dynamic accumulation zones based on price history
   */
  calculateAccumulationZones(prices: number[][]): number[] {
    if (!prices || prices.length < 30) return [];

    const closes = prices.map(p => p[1]);
    const sorted = [...closes].sort((a, b) => a - b);
    
    // Find key percentiles for accumulation zones
    const len = sorted.length;
    const zone1 = sorted[Math.floor(len * 0.25)]; // 25th percentile
    const zone2 = sorted[Math.floor(len * 0.15)]; // 15th percentile  
    const zone3 = sorted[Math.floor(len * 0.05)]; // 5th percentile

    return [zone1, zone2, zone3].map(z => Math.round(z * 100) / 100);
  }

  /**
   * Find coins with good risk/reward setup
   * - Down significantly from ATH
   * - Showing recent strength
   * - Good market cap (not too small, not too big)
   */
  async findOpportunities(): Promise<any[]> {
    const coins = await this.fetchTopCoins(250);
    
    return coins.filter((coin: any) => {
      const athChange = coin.ath_change_percentage || 0;
      const priceChange24h = coin.price_change_percentage_24h || 0;
      const priceChange7d = coin.price_change_percentage_7d_in_currency || 0;
      const marketCap = coin.market_cap || 0;
      
      // Criteria for opportunity:
      // - Down 50%+ from ATH (value opportunity)
      // - Recent positive momentum (24h or 7d positive)
      // - Market cap between $100M and $10B (liquid but not too big)
      const isDownFromATH = athChange < -50;
      const hasRecentMomentum = priceChange24h > 0 || priceChange7d > 0;
      const goodMarketCap = marketCap > 100_000_000 && marketCap < 10_000_000_000;
      
      return isDownFromATH && hasRecentMomentum && goodMarketCap;
    }).slice(0, 20);
  }
}

export const marketDataService = new MarketDataService();
