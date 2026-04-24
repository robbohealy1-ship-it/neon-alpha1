import axios from 'axios';

export interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  ema12: number;
  ema26: number;
  ema50: number;
  ema200: number;
  rsi: number;
  avgVolume: number;
}

export class BinanceService {
  private baseUrl = 'https://api.binance.com/api/v3';

  async getOHLCV(symbol: string, interval: string, limit: number = 200): Promise<OHLCVData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: {
          symbol: symbol,
          interval: interval,
          limit: limit
        },
        timeout: 10000
      });

      return response.data.map((k: any[]) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));
    } catch (error) {
      console.error(`Error fetching OHLCV for ${symbol}:`, error);
      return [];
    }
  }

  calculateEMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0;
    
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    
    return ema;
  }

  calculateRSI(data: number[], period: number = 14): number {
    if (data.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = data[i] - data[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateTechnicalIndicators(ohlcv: OHLCVData[]): TechnicalIndicators {
    const closes = ohlcv.map(c => c.close);
    const volumes = ohlcv.map(c => c.volume);
    
    return {
      ema12: this.calculateEMA(closes, 12),
      ema26: this.calculateEMA(closes, 26),
      ema50: this.calculateEMA(closes, 50),
      ema200: this.calculateEMA(closes, 200),
      rsi: this.calculateRSI(closes),
      avgVolume: volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
    };
  }

  detectBullishDivergence(ohlcv: OHLCVData[], rsi: number): boolean {
    if (ohlcv.length < 20) return false;
    
    const recentLows = ohlcv.slice(-10).map(c => c.low);
    const minPrice = Math.min(...recentLows);
    const minPriceIndex = recentLows.indexOf(minPrice);
    
    // If price made a new low but RSI didn't make a new low (divergence)
    if (minPriceIndex === recentLows.length - 1 && rsi > 35) {
      return true;
    }
    
    return false;
  }
}

export const binanceService = new BinanceService();
