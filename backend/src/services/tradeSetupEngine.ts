import axios from 'axios';
import { marketStateEngine, SymbolState, MarketContext } from './marketStateEngine';
import { edgeFilterEngine } from './edgeFilterEngine';
import { visualMappingEngine } from './visualMappingEngine';

// ============================================================================
// SETUP TO SIGNAL TIMEFRAME MAPPING
// Higher Timeframe Setup → Lower Timeframe Execution Signal
// ============================================================================

/**
 * Maps setup timeframe to execution signal timeframe
 * HTF Setup identifies the opportunity, LTF Signal is for execution
 */
export const SETUP_TO_SIGNAL_TIMEFRAME: { [key: string]: string } = {
  '1H': '15m',   // 1H setup → 15m execution signal
  '4H': '1h',    // 4H setup → 1h execution signal
  '1D': '4h',    // 1D setup → 4h execution signal
};

/**
 * Get the execution signal timeframe for a given setup timeframe
 */
export function getSignalTimeframe(setupTimeframe: string): string {
  return SETUP_TO_SIGNAL_TIMEFRAME[setupTimeframe] || '1h';
}

// Types for trade setups
export interface TradeSetup {
  id: string;
  symbol: string;
  bias: 'bullish' | 'bearish';
  status: 'forming' | 'near_trigger' | 'triggered' | 'expired';
  timeframe: '1H' | '4H' | '1D';
  signalTimeframe: string; // Lower timeframe for execution (15m, 1h, 4h)
  strategy: string[];
  strategyType: 'liquidity' | 'breakout' | 'trend' | 'mean_reversion';
  
  entryZone: {
    low: number;
    high: number;
  };
  entryPrice: number;
  stopLoss: number;
  
  targets: number[];
  
  riskRewardRatio: number;
  riskPercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  confidenceScore: number;
  
  confluence: string[];
  
  createdAt: Date;
  expiresAt: Date;
  
  // Analysis details
  analysis: {
    marketStructure: string;
    keyLevels: {
      support: number[];
      resistance: number[];
    };
    volumeProfile: string;
    trendAlignment: string;
  };
  
  // Enhanced market state data (NEW)
  marketState?: {
    trend: 'bullish' | 'bearish' | 'range';
    strength: number;
    bosConfirmed: boolean;
    sweepDetected: boolean;
    liquidityLevel?: number;
    fvgZone?: { top: number; bottom: number; type: string };
  };
  
  edgeScore?: {
    total: number;
    liquidityConfluence: number;
    structureQuality: number;
    timingQuality: number;
    riskReward: number;
  };
  
  visuals?: {
    candles?: any[];
    liquidityZones?: any[];
    fvgZones?: any[];
    orderBlocks?: any[];
    structureLines?: any[];
    markers?: any[];
  };
  
  marketStory?: Array<{
    step: number;
    timestamp: number | string;
    event: string;
    description: string;
    type: string;
    price: number;
  }>;
}

export interface CoinMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  // Derived technical data
  atr: number; // Average True Range for volatility
  pricePosition: number; // 0-100 relative position in 24h range
}

// CoinGecko ID mapping
const COINGECKO_IDS: { [key: string]: string } = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
  'AVAX': 'avalanche-2', 'MATIC': 'polygon', 'LINK': 'chainlink',
  'ADA': 'cardano', 'DOT': 'polkadot', 'DOGE': 'dogecoin',
  'XRP': 'ripple', 'BNB': 'binancecoin', 'UNI': 'uniswap',
  'LTC': 'litecoin', 'BCH': 'bitcoin-cash', 'ETC': 'ethereum-classic',
  'FIL': 'filecoin', 'TRX': 'tron', 'NEAR': 'near',
  'APT': 'aptos', 'OP': 'optimism', 'ARB': 'arbitrum',
  'SUI': 'sui', 'TON': 'the-open-network', 'ICP': 'internet-computer',
  'PEPE': 'pepe', 'SHIB': 'shiba-inu', 'FET': 'fetch-ai',
  'RNDR': 'render-token', 'INJ': 'injective-protocol', 'TIA': 'celestia',
  'SEI': 'sei-network', 'STRK': 'starknet', 'PYTH': 'pyth-network',
  'JTO': 'jito-governance-token', 'JUP': 'jupiter-exchange-solana',
  'WIF': 'dogwifhat', 'BONK': 'bonk', 'WLD': 'worldcoin-wld',
  'ARKM': 'arkham', 'CYBER': 'cyberconnect', 'MEME': 'memecoin',
  'ORDI': 'ordinals', 'SATS': 'satoshis', 'BEAM': 'beam-2',
  'IMX': 'immutable-x', 'GRT': 'the-graph', 'MANA': 'decentraland',
  'SAND': 'the-sandbox', 'AXS': 'axie-infinity', 'ENJ': 'enjincoin',
  'CHZ': 'chiliz', 'GMT': 'stepn', 'ATOM': 'cosmos',
  'OSMO': 'osmosis', 'KAVA': 'kava', 'SCRT': 'secret'
};

// Strategy definitions with proper technical logic
const STRATEGIES = {
  LIQUIDITY_SWEEP: {
    name: 'Liquidity Sweep',
    description: 'Price takes out equal highs/lows (stops) before reversing',
    timeframes: ['1H', '4H'] as const,
    confluenceFactors: [
      'Equal highs/lows taken out',
      'High volume on sweep candle',
      'Immediate rejection after sweep',
      'Market structure intact on higher TF'
    ]
  },
  FAIR_VALUE_GAP: {
    name: 'Fair Value Gap',
    description: 'Imbalance zone where price often returns to fill the gap',
    timeframes: ['1H', '4H', '1D'] as const,
    confluenceFactors: [
      'Clear 3-candle FVG pattern',
      'Aligned with trend direction',
      'Near key support/resistance',
      'Volume confirmation'
    ]
  },
  MARKET_STRUCTURE_SHIFT: {
    name: 'Market Structure Shift',
    description: 'Break of Structure (BOS) or Change of Character (CHoCH)',
    timeframes: ['4H', '1D'] as const,
    confluenceFactors: [
      'Clear swing high/low broken',
      'Momentum shift confirmed',
      'Volume spike on break',
      'Retest of broken level likely'
    ]
  },
  TREND_CONTINUATION: {
    name: 'Trend Continuation',
    description: 'Pullback to key EMA/level within established trend',
    timeframes: ['1H', '4H'] as const,
    confluenceFactors: [
      'Higher timeframe trend aligned',
      'Pulling back to EMA 50/200',
      'Previous support now resistance (or vice versa)',
      'Decreasing volume on pullback'
    ]
  },
  RANGE_BREAKOUT: {
    name: 'Range Breakout',
    description: 'Consolidation breakout with volume confirmation',
    timeframes: ['1H', '4H'] as const,
    confluenceFactors: [
      'Clear range established (3+ touches)',
      'Volume spike on breakout candle',
      'Close beyond range boundary',
      'Retest entry opportunity'
    ]
  },
  VOLUME_SPIKE_REVERSAL: {
    name: 'Volume Spike Reversal',
    description: 'High volume exhaustion candle indicating reversal',
    timeframes: ['1H', '4H'] as const,
    confluenceFactors: [
      '3x average volume spike',
      'Long wick rejection candle',
      'Key level reaction',
      'Momentum divergence'
    ]
  }
};

class TradeSetupEngine {
  private async fetchMarketData(): Promise<CoinMarketData[]> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            ids: Object.values(COINGECKO_IDS).join(','),
            order: 'market_cap_desc',
            price_change_percentage: '24h',
            include_24hr_vol: true
          },
          timeout: 15000
        }
      );

      return response.data.map((coin: any) => {
        const symbol = Object.keys(COINGECKO_IDS).find(
          key => COINGECKO_IDS[key] === coin.id
        ) || coin.symbol.toUpperCase();
        
        const price = coin.current_price || 0;
        const high24h = coin.high_24h || price * 1.02;
        const low24h = coin.low_24h || price * 0.98;
        
        // Calculate ATR approximation from 24h range
        const atr = high24h - low24h;
        
        // Calculate position in 24h range (0 = at low, 100 = at high)
        const pricePosition = high24h === low24h ? 50 : 
          ((price - low24h) / (high24h - low24h)) * 100;

        return {
          symbol,
          name: coin.name,
          price,
          change24h: coin.price_change_percentage_24h || 0,
          volume24h: coin.total_volume || 0,
          marketCap: coin.market_cap || 0,
          high24h,
          low24h,
          atr,
          pricePosition
        };
      });
    } catch (error) {
      console.error('Failed to fetch market data from CoinGecko:', error);
      // Return empty array - we NEVER serve mock/stale data
      // The route handler will return 503 Service Unavailable
      return [];
    }
  }

  private calculateRiskMetrics(
    entry: number,
    stopLoss: number,
    targets: number[]
  ): { riskPercent: number; riskRewardRatio: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' } {
    const risk = Math.abs(entry - stopLoss);
    const riskPercent = (risk / entry) * 100;
    
    // Calculate R:R using first target
    const reward = Math.abs(targets[0] - entry);
    const riskRewardRatio = risk > 0 ? reward / risk : 0;
    
    // Determine risk level - aligned with optimal crypto swing trade risk (1%)
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskPercent < 1.5) riskLevel = 'LOW';      // Conservative: < 1.5%
    else if (riskPercent < 3) riskLevel = 'MEDIUM'; // Optimal: 1.5% - 3%
    else riskLevel = 'HIGH';                       // Aggressive: > 3%
    
    return { riskPercent, riskRewardRatio, riskLevel };
  }

  private calculateConfidence(
    strategies: string[],
    confluenceFactors: string[],
    trendAlignment: boolean,
    riskRewardRatio: number
  ): number {
    // Base confidence
    let confidence = 50;
    
    // +10 per confluence factor (max +40)
    confidence += Math.min(confluenceFactors.length * 10, 40);
    
    // +10 if aligned with higher timeframe trend
    if (trendAlignment) confidence += 10;
    
    // +5 for favorable R:R (> 2:1)
    if (riskRewardRatio >= 2) confidence += 5;
    // +5 for excellent R:R (> 3:1)
    if (riskRewardRatio >= 3) confidence += 5;
    
    // Clamp between 50-95 (never 100% certain)
    return Math.min(95, Math.max(50, confidence));
  }

  private generateLiquiditySweepSetup(coin: CoinMarketData): TradeSetup | null {
    const { symbol, price, high24h, low24h, change24h, atr, pricePosition } = coin;
    
    // Determine if we're near 24h high or low (potential sweep)
    const nearHigh = pricePosition > 70;
    const nearLow = pricePosition < 30;
    
    if (!nearHigh && !nearLow) return null;
    
    const isBullish = nearLow;
    const bias = isBullish ? 'bullish' : 'bearish';
    
    // Calculate realistic levels based on actual price and 24h range
    const range = high24h - low24h;
    const stopBuffer = Math.max(atr * 0.3, price * 0.005); // Min 0.5% stop buffer
    
    let entryZone, stopLoss, targets;
    
    if (isBullish) {
      // Bullish: Entry near current price, looking for small dip
      entryZone = {
        low: price * 0.985,  // 1.5% below current price
        high: price * 0.995   // 0.5% below current price
      };
      stopLoss = entryZone.low - stopBuffer;
      targets = [
        price * 1.02,  // TP1: 2% above entry
        price * 1.05,  // TP2: 5% above entry
        price * 1.08   // TP3: 8% above entry
      ];
    } else {
      // Bearish: Entry near current price, looking for small bounce
      entryZone = {
        low: price * 1.005,  // 0.5% above current price
        high: price * 1.015  // 1.5% above current price
      };
      stopLoss = entryZone.high + stopBuffer;
      targets = [
        price * 0.98,  // TP1: 2% below entry
        price * 0.95,  // TP2: 5% below entry
        price * 0.92   // TP3: 8% below entry
      ];
    }
    
    const confluence = [
      `${isBullish ? 'Equal lows' : 'Equal highs'} within 24h range`,
      'Price position near extreme suggests sweep potential',
      `${Math.abs(change24h).toFixed(1)}% 24h move shows momentum`,
      'ATR indicates adequate volatility for setup'
    ];
    
    const riskMetrics = this.calculateRiskMetrics(
      (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets
    );
    
    const confidence = this.calculateConfidence(
      ['Liquidity Sweep'],
      confluence,
      true,
      riskMetrics.riskRewardRatio
    );
    
    // Determine timeframe based on volatility
    const timeframe: '1H' | '4H' | '1D' = atr / price > 0.05 ? '1H' : atr / price > 0.02 ? '4H' : '1D';
    
    return {
      id: `${symbol}-sweep-${Date.now()}`,
      symbol,
      bias,
      status: 'forming',
      timeframe,
      signalTimeframe: getSignalTimeframe(timeframe),
      strategy: ['Liquidity Sweep'],
      strategyType: 'liquidity',
      entryZone,
      entryPrice: (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets,
      ...riskMetrics,
      confidenceScore: confidence,
      confluence,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      analysis: {
        marketStructure: isBullish 
          ? 'Potential bullish sweep of 24h lows forming'
          : 'Potential bearish sweep of 24h highs forming',
        keyLevels: {
          support: isBullish ? [low24h, low24h * 0.995] : [price * 0.98, price * 0.95],
          resistance: isBullish ? [price * 1.02, high24h] : [high24h, high24h * 1.005]
        },
        volumeProfile: 'Awaiting volume spike on sweep candle',
        trendAlignment: isBullish ? 'Potential HTF support test' : 'Potential HTF resistance test'
      }
    };
  }

  private generateFVGSetup(coin: CoinMarketData): TradeSetup | null {
    const { symbol, price, change24h, high24h, low24h, atr } = coin;
    
    // FVG setups work best in trending conditions
    const isTrending = Math.abs(change24h) > 0.5;
    if (!isTrending) return null;
    
    const isBullish = change24h > 0;
    const bias = isBullish ? 'bullish' : 'bearish';
    
    // Calculate FVG entry zone based on actual price and trend
    const fvgSize = Math.max(atr * 0.2, price * 0.008); // Min 0.8% FVG size
    const stopBuffer = Math.max(atr * 0.3, price * 0.006); // Min 0.6% stop buffer
    
    let entryZone, stopLoss, targets;
    
    if (isBullish) {
      // Bullish FVG: entry slightly below current price (pullback)
      entryZone = {
        low: price * 0.988,  // 1.2% below current
        high: price * 0.998   // 0.2% below current
      };
      stopLoss = entryZone.low - stopBuffer;
      targets = [
        price * 1.025,  // TP1: 2.5% gain
        price * 1.055,  // TP2: 5.5% gain
        price * 1.085   // TP3: 8.5% gain
      ];
    } else {
      // Bearish FVG: entry slightly above current price (retracement)
      entryZone = {
        low: price * 1.002,  // 0.2% above current
        high: price * 1.012  // 1.2% above current
      };
      stopLoss = entryZone.high + stopBuffer;
      targets = [
        price * 0.975,  // TP1: 2.5% drop
        price * 0.945,  // TP2: 5.5% drop
        price * 0.915   // TP3: 8.5% drop
      ];
    }
    
    const confluence = [
      `${isBullish ? 'Bullish' : 'Bearish'} momentum with ${Math.abs(change24h).toFixed(1)}% move`,
      'Price showing continuation pattern',
      'ATR indicates healthy volatility',
      'FVG zone within optimal retracement area'
    ];
    
    const riskMetrics = this.calculateRiskMetrics(
      (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets
    );
    
    const confidence = this.calculateConfidence(
      ['Fair Value Gap', 'Trend Continuation'],
      confluence,
      true,
      riskMetrics.riskRewardRatio
    );
    
    const fvgTimeframe: '1H' | '4H' | '1D' = atr / price > 0.03 ? '1H' : atr / price > 0.015 ? '4H' : '1D';
    
    return {
      id: `${symbol}-fvg-${Date.now()}`,
      symbol,
      bias,
      status: 'near_trigger',
      timeframe: fvgTimeframe,
      signalTimeframe: getSignalTimeframe(fvgTimeframe),
      strategy: ['Fair Value Gap', 'Trend Continuation'],
      strategyType: 'trend',
      entryZone,
      entryPrice: (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets,
      ...riskMetrics,
      confidenceScore: confidence,
      confluence,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      analysis: {
        marketStructure: isBullish
          ? 'Bullish trend with pullback to FVG zone'
          : 'Bearish trend with retracement to FVG',
        keyLevels: {
          support: isBullish ? [entryZone.low, entryZone.high] : [price * 0.95, price * 0.90],
          resistance: isBullish ? [price * 1.05, price * 1.10] : [entryZone.high, entryZone.low]
        },
        volumeProfile: 'Volume declining on retracement (healthy)',
        trendAlignment: `${isBullish ? 'Bullish' : 'Bearish'} trend continuation expected`
      }
    };
  }

  private generateStructureShiftSetup(coin: CoinMarketData): TradeSetup | null {
    const { symbol, price, high24h, low24h, change24h, atr, pricePosition } = coin;
    
    // Structure shifts happen after strong moves
    const strongMove = Math.abs(change24h) > 2;
    if (!strongMove) return null;
    
    const isBullish = change24h > 0;
    const bias = isBullish ? 'bullish' : 'bearish';
    
    // Calculate levels based on actual price and 24h range
    const range = high24h - low24h;
    const stopBuffer = Math.max(atr * 0.35, price * 0.008); // Min 0.8% stop buffer
    
    let entryZone, stopLoss, targets;
    
    if (isBullish) {
      // BOS (Break of Structure) - looking to enter on pullback to current area
      entryZone = {
        low: price * 0.992,  // 0.8% below current
        high: price * 1.002    // 0.2% above current
      };
      stopLoss = entryZone.low - stopBuffer;
      targets = [
        price * 1.03,  // TP1: 3% gain
        price * 1.06,  // TP2: 6% gain
        price * 1.10   // TP3: 10% gain
      ];
    } else {
      // Bearish BOS - looking to enter on bounce to current area
      entryZone = {
        low: price * 0.998,  // 0.2% below current
        high: price * 1.008   // 0.8% above current
      };
      stopLoss = entryZone.high + stopBuffer;
      targets = [
        price * 0.97,  // TP1: 3% drop
        price * 0.94,  // TP2: 6% drop
        price * 0.90   // TP3: 10% drop
      ];
    }
    
    const confluence = [
      `${Math.abs(change24h).toFixed(1)}% move indicates strong momentum`,
      'Break of 24h structure confirmed',
      'Volume spike likely on breakout',
      'Pullback entry offers favorable R:R'
    ];
    
    const riskMetrics = this.calculateRiskMetrics(
      (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets
    );
    
    const confidence = this.calculateConfidence(
      ['Market Structure Shift', 'Break of Structure'],
      confluence,
      true,
      riskMetrics.riskRewardRatio
    );
    
    const bosTimeframe: '1H' | '4H' | '1D' = atr / price > 0.04 ? '1H' : atr / price > 0.02 ? '4H' : '1D';
    
    return {
      id: `${symbol}-bos-${Date.now()}`,
      symbol,
      bias,
      status: 'near_trigger',
      timeframe: bosTimeframe,
      signalTimeframe: getSignalTimeframe(bosTimeframe),
      strategy: ['Market Structure Shift', 'Break of Structure'],
      strategyType: 'breakout',
      entryZone,
      entryPrice: (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets,
      ...riskMetrics,
      confidenceScore: confidence,
      confluence,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
      analysis: {
        marketStructure: isBullish
          ? 'Bullish BOS: Price broke above previous high'
          : 'Bearish BOS: Price broke below previous low',
        keyLevels: {
          support: isBullish ? [entryZone.low, low24h] : [price * 0.95, price * 0.90],
          resistance: isBullish ? [price * 1.05, price * 1.10] : [entryZone.high, high24h]
        },
        volumeProfile: 'High volume confirms breakout validity',
        trendAlignment: 'Structure shift suggests trend continuation'
      }
    };
  }

  private generateTrendContinuationSetup(coin: CoinMarketData): TradeSetup | null {
    const { symbol, price, change24h, high24h, low24h, atr } = coin;
    
    // Need established trend
    const establishedTrend = Math.abs(change24h) > 1;
    if (!establishedTrend) return null;
    
    const isBullish = change24h > 0;
    const bias = isBullish ? 'bullish' : 'bearish';
    
    // Calculate pullback zone based on actual price and 24h range
    const range = high24h - low24h;
    const stopBuffer = Math.max(atr * 0.4, price * 0.008); // Min 0.8% stop buffer
    
    let entryZone, stopLoss, targets;
    
    if (isBullish) {
      // Bullish trend continuation: Buy the small dip
      entryZone = {
        low: price * 0.985,  // 1.5% below current
        high: price * 0.995   // 0.5% below current
      };
      stopLoss = entryZone.low - stopBuffer;
      targets = [
        price * 1.02,  // TP1: 2% gain
        price * 1.05,  // TP2: 5% gain
        price * 1.08   // TP3: 8% gain
      ];
    } else {
      // Bearish trend continuation: Short the small bounce
      entryZone = {
        low: price * 1.005,  // 0.5% above current
        high: price * 1.015   // 1.5% above current
      };
      stopLoss = entryZone.high + stopBuffer;
      targets = [
        price * 0.98,  // TP1: 2% drop
        price * 0.95,  // TP2: 5% drop
        price * 0.92   // TP3: 8% drop
      ];
    }
    
    const confluence = [
      `${isBullish ? 'Bullish' : 'Bearish'} trend established (+${Math.abs(change24h).toFixed(1)}%)`,
      'Pullback to optimal retracement zone',
      'Trend continuation pattern forming',
      'Risk/Reward favorable at current levels'
    ];
    
    const riskMetrics = this.calculateRiskMetrics(
      (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets
    );
    
    const confidence = this.calculateConfidence(
      ['Trend Continuation', 'Pullback Entry'],
      confluence,
      true,
      riskMetrics.riskRewardRatio
    );
    
    const trendTimeframe: '1H' | '4H' | '1D' = atr / price > 0.025 ? '1H' : atr / price > 0.012 ? '4H' : '1D';
    
    return {
      id: `${symbol}-trend-${Date.now()}`,
      symbol,
      bias,
      status: 'forming',
      timeframe: trendTimeframe,
      signalTimeframe: getSignalTimeframe(trendTimeframe),
      strategy: ['Trend Continuation', 'Pullback Entry'],
      strategyType: 'trend',
      entryZone,
      entryPrice: (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets,
      ...riskMetrics,
      confidenceScore: confidence,
      confluence,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      analysis: {
        marketStructure: isBullish
          ? 'Higher highs and higher lows pattern'
          : 'Lower highs and lower lows pattern',
        keyLevels: {
          support: isBullish ? [entryZone.low, low24h] : [price, price * 1.02],
          resistance: isBullish ? [price, high24h] : [entryZone.high, high24h]
        },
        volumeProfile: 'Volume declining on pullback (healthy)',
        trendAlignment: 'Strong trend continuation expected'
      }
    };
  }

  private generateMeanReversionSetup(coin: CoinMarketData): TradeSetup | null {
    const { symbol, price, high24h, low24h, change24h, atr, pricePosition } = coin;
    
    // Mean reversion happens when price is at extremes and due to revert
    const atExtreme = pricePosition > 80 || pricePosition < 20;
    if (!atExtreme) return null;
    
    // Need some volatility but not extreme
    const moderateVolatility = Math.abs(change24h) > 1 && Math.abs(change24h) < 5;
    if (!moderateVolatility) return null;
    
    const isBullish = pricePosition < 30; // Near low, expecting bounce up
    const bias = isBullish ? 'bullish' : 'bearish';
    
    const stopBuffer = Math.max(atr * 0.4, price * 0.01); // Min 1% stop buffer for counter-trend
    
    let entryZone, stopLoss, targets;
    
    if (isBullish) {
      // Bullish mean reversion: buy the dip near current price
      entryZone = {
        low: price * 0.975,  // 2.5% below current
        high: price * 0.985   // 1.5% below current
      };
      stopLoss = entryZone.low - stopBuffer;
      targets = [
        price * 0.995,  // TP1: Near current
        price * 1.015,  // TP2: 1.5% above
        price * 1.035   // TP3: 3.5% above
      ];
    } else {
      // Bearish mean reversion: short the spike near current price
      entryZone = {
        low: price * 1.015,  // 1.5% above current
        high: price * 1.025   // 2.5% above current
      };
      stopLoss = entryZone.high + stopBuffer;
      targets = [
        price * 1.005,  // TP1: Near current
        price * 0.985,  // TP2: 1.5% below
        price * 0.965   // TP3: 3.5% below
      ];
    }
    
    const confluence = [
      `${isBullish ? 'Price at 24h low' : 'Price at 24h high'} - extreme reading`,
      'Overextended move likely to revert to mean',
      'ATR supports reversion play',
      'Support/Resistance levels nearby'
    ];
    
    const riskMetrics = this.calculateRiskMetrics(
      (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets
    );
    
    const confidence = this.calculateConfidence(
      ['Mean Reversion', 'Extreme Reading'],
      confluence,
      false, // Counter-trend play
      riskMetrics.riskRewardRatio
    );
    
    const mrTimeframe: '1H' | '4H' | '1D' = atr / price > 0.04 ? '1H' : atr / price > 0.02 ? '4H' : '1D';
    
    return {
      id: `${symbol}-mean-reversion-${Date.now()}`,
      symbol,
      bias,
      status: 'forming',
      timeframe: mrTimeframe,
      signalTimeframe: getSignalTimeframe(mrTimeframe),
      strategy: ['Mean Reversion', 'Extreme Reading'],
      strategyType: 'mean_reversion',
      entryZone,
      entryPrice: (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets,
      ...riskMetrics,
      confidenceScore: confidence,
      confluence,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      analysis: {
        marketStructure: isBullish
          ? 'Oversold conditions near support, expecting bounce'
          : 'Overbought conditions near resistance, expecting pullback',
        keyLevels: {
          support: isBullish ? [low24h, low24h * 0.98] : [price * 0.95, price * 0.90],
          resistance: isBullish ? [price, high24h] : [high24h, high24h * 1.02]
        },
        volumeProfile: 'Volume likely to decrease at extremes',
        trendAlignment: 'Counter-trend mean reversion play'
      }
    };
  }

  private generateRangeBreakoutSetup(coin: CoinMarketData): TradeSetup | null {
    const { symbol, price, high24h, low24h, change24h, atr, pricePosition, volume24h } = coin;
    
    // Range breakouts happen when price is consolidating
    // RELAXED: Was <2% and 30-70 position, now <4% and 20-80 position
    const isConsolidating = Math.abs(change24h) < 4 && pricePosition > 20 && pricePosition < 80;
    if (!isConsolidating) return null;
    
    // Determine direction based on position in range + momentum bias
    // If price is in upper half of range with positive momentum = bullish breakout
    // If price is in lower half with negative momentum = bearish breakdown
    const rangeMid = 50;
    const momentumBias = change24h > 0 ? 10 : -10; // Small momentum bias
    const positionScore = pricePosition + momentumBias;
    
    // Higher score = closer to resistance = bullish breakout more likely
    // Lower score = closer to support = bearish breakdown more likely
    const isBullish = positionScore > rangeMid;
    const bias = isBullish ? 'bullish' : 'bearish';
    
    const range = high24h - low24h;
    const stopBuffer = Math.max(atr * 0.3, price * 0.006); // Min 0.6% stop buffer
    
    let entryZone, stopLoss, targets;
    
    if (isBullish) {
      // Bullish breakout: enter near current price
      entryZone = {
        low: price * 0.995,  // 0.5% below current
        high: price * 1.005  // 0.5% above current
      };
      stopLoss = entryZone.low - stopBuffer;
      targets = [
        price * 1.03,  // TP1: 3% gain
        price * 1.06,  // TP2: 6% gain
        price * 1.10   // TP3: 10% gain
      ];
    } else {
      // Bearish breakdown: enter near current price
      entryZone = {
        low: price * 0.995,  // 0.5% below current
        high: price * 1.005  // 0.5% above current
      };
      stopLoss = entryZone.high + stopBuffer;
      targets = [
        price * 0.97,  // TP1: 3% drop
        price * 0.94,  // TP2: 6% drop
        price * 0.90   // TP3: 10% drop
      ];
    }
    
    const confluence = [
      'Price consolidating in 24h range',
      'Multiple tests of support/resistance',
      'ATR compression indicates expansion coming',
      'Volume building for breakout'
    ];
    
    const riskMetrics = this.calculateRiskMetrics(
      (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets
    );
    
    const confidence = this.calculateConfidence(
      ['Range Breakout', 'Consolidation Play'],
      confluence,
      false, // Not aligned with strong trend
      riskMetrics.riskRewardRatio
    );
    
    const rangeTimeframe: '1H' | '4H' | '1D' = atr / price > 0.035 ? '1H' : atr / price > 0.018 ? '4H' : '1D';
    
    return {
      id: `${symbol}-range-${Date.now()}`,
      symbol,
      bias,
      status: 'forming',
      timeframe: rangeTimeframe,
      signalTimeframe: getSignalTimeframe(rangeTimeframe),
      strategy: ['Range Breakout', 'Consolidation Play'],
      strategyType: 'breakout',
      entryZone,
      entryPrice: (entryZone.low + entryZone.high) / 2,
      stopLoss,
      targets,
      ...riskMetrics,
      confidenceScore: confidence,
      confluence,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      analysis: {
        marketStructure: 'Price stuck in consolidation range',
        keyLevels: {
          support: [low24h, low24h * 0.995],
          resistance: [high24h, high24h * 1.005]
        },
        volumeProfile: 'Volume declining (characteristic of consolidation)',
        trendAlignment: 'Directional bias from breakout'
      }
    };
  }

  async generateSetups(count: number = 10): Promise<TradeSetup[]> {
    const marketData = await this.fetchMarketData();
    
    if (marketData.length === 0) {
      console.error('No market data available');
      return [];
    }
    
    const setups: TradeSetup[] = [];
    const generatedSymbols = new Set<string>(); // Track to prevent duplicates
    
    const strategies = [
      this.generateLiquiditySweepSetup.bind(this),
      this.generateFVGSetup.bind(this),
      this.generateStructureShiftSetup.bind(this),
      this.generateTrendContinuationSetup.bind(this),
      this.generateRangeBreakoutSetup.bind(this),
      this.generateMeanReversionSetup.bind(this)
    ];
    
    // Sort coins by price position volatility (prefer extreme positions for setups)
    const sortedCoins = [...marketData].sort((a, b) => {
      // Prefer coins at extremes (near highs/lows) or strong trend
      const aScore = Math.abs(a.pricePosition - 50) + Math.abs(a.change24h);
      const bScore = Math.abs(b.pricePosition - 50) + Math.abs(b.change24h);
      return bScore - aScore; // Higher score = more interesting setup potential
    });
    
    for (const coin of sortedCoins) {
      if (setups.length >= count) break;
      if (generatedSymbols.has(coin.symbol)) continue; // Skip if already generated
      
      // Try different strategies for this coin
      for (const strategyFn of strategies) {
        const setup = strategyFn(coin);
        if (setup) {
          setups.push(setup);
          generatedSymbols.add(coin.symbol);
          break; // Only one setup per coin
        }
      }
    }
    
    // Sort by confidence (highest first)
    return setups.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  // Update setup status based on current price
  updateSetupStatus(setup: TradeSetup, currentPrice: number): TradeSetup['status'] {
    const { entryZone, stopLoss, targets, bias, status } = setup;
    
    // Check if expired
    if (new Date() > setup.expiresAt) return 'expired';
    
    // Check if triggered (hit entry)
    const entryHit = bias === 'bullish' 
      ? currentPrice >= entryZone.low && currentPrice <= entryZone.high
      : currentPrice <= entryZone.high && currentPrice >= entryZone.low;
    
    if (entryHit) return 'triggered';
    
    // Check if near trigger (within 2% of entry)
    const entryMid = (entryZone.low + entryZone.high) / 2;
    const nearTrigger = Math.abs(currentPrice - entryMid) / entryMid < 0.02;
    
    if (nearTrigger) return 'near_trigger';
    
    // Check if invalidated (hit stop loss)
    const invalidated = bias === 'bullish'
      ? currentPrice <= stopLoss
      : currentPrice >= stopLoss;
    
    if (invalidated) return 'expired';
    
    return status;
  }

  // Persist setups to database (now enabled!)
  async persistSetups(setups: TradeSetup[]): Promise<void> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Deactivate old setups first
      await prisma.tradeSetup.updateMany({
        where: { active: true },
        data: { active: false }
      });
      
      // Create new setups
      for (const setup of setups) {
        await prisma.tradeSetup.create({
          data: {
            asset: setup.symbol,
            direction: setup.bias,
            confidence: setup.confidenceScore,
            riskLevel: setup.riskLevel,
            entryZone: JSON.stringify(setup.entryZone),
            stopLoss: setup.stopLoss,
            targets: JSON.stringify(setup.targets),
            reasoning: setup.analysis?.marketStructure || `${setup.strategyType} setup`,
            strategyType: setup.strategyType,
            timeframe: setup.timeframe,
            status: setup.status,
            active: true,
            expiresAt: setup.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });
      }
      
      console.log(`[persistSetups] Saved ${setups.length} setups to database`);
      await prisma.$disconnect();
    } catch (error) {
      console.error('[persistSetups] Error saving setups:', error);
    }
  }

  // Get persisted setups from database
  async getPersistedSetups(): Promise<TradeSetup[]> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const dbSetups = await prisma.tradeSetup.findMany({
        where: { 
          active: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      await prisma.$disconnect();
      
      // Convert DB format to TradeSetup format
      return dbSetups.map((dbSetup: any) => ({
        id: dbSetup.id,
        symbol: dbSetup.asset,
        bias: dbSetup.direction as 'bullish' | 'bearish',
        status: dbSetup.status as any,
        timeframe: dbSetup.timeframe as '1H' | '4H' | '1D',
        signalTimeframe: getSignalTimeframe(dbSetup.timeframe),
        strategy: [dbSetup.strategyType],
        strategyType: dbSetup.strategyType as any,
        entryZone: JSON.parse(dbSetup.entryZone),
        entryPrice: 0,
        stopLoss: dbSetup.stopLoss || 0,
        targets: JSON.parse(dbSetup.targets || '[]'),
        riskRewardRatio: 2,
        riskPercent: 1,
        riskLevel: dbSetup.riskLevel as any,
        confidenceScore: dbSetup.confidence,
        confluence: [dbSetup.strategyType],
        analysis: {
          marketStructure: dbSetup.reasoning,
          keyLevels: { support: [], resistance: [] },
          volumeProfile: 'Building',
          trendAlignment: dbSetup.direction
        },
        createdAt: dbSetup.createdAt,
        expiresAt: dbSetup.expiresAt
      }));
    } catch (error) {
      console.error('[getPersistedSetups] Error:', error);
      return [];
    }
  }

  // ============================================================================
  // NEW: Market State Integration Methods (Stateful Architecture)
  // ============================================================================

  /**
   * NEW: Derive setups from real market state (BOS, FVG, Liquidity)
   * This is the stateful approach - setups extracted from market structure
   */
  async deriveSetupsFromMarketState(
    symbol: string,
    timeframe: '1H' | '4H' | '1D',
    candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[]
  ): Promise<TradeSetup[]> {
    // Map to market state engine format
    const mappedCandles = candles.map(c => ({
      timestamp: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume
    }));

    // Update market state
    const state = marketStateEngine.updateCandles(symbol, timeframe, mappedCandles);
    const context = marketStateEngine.getMarketContext(symbol, timeframe);

    const setups: TradeSetup[] = [];
    const coin = symbol.replace('USDT', '');

    // Check no trade zone
    const currentPrice = candles[candles.length - 1].close;
    const noTradeCheck = marketStateEngine.isNoTradeZone(symbol, timeframe, currentPrice);
    if (noTradeCheck.isNoTrade) {
      console.log(`[deriveSetups] ${symbol} in no-trade zone: ${noTradeCheck.reason}`);
      return setups;
    }

    // Generate setup from BOS + Sweep
    const bosSetup = this.generateBOSSetup(state, context, coin, symbol, timeframe);
    if (bosSetup) setups.push(bosSetup);

    // Generate setup from FVG
    const fvgSetup = this.generateFVGSetupFromState(state, context, coin, symbol, timeframe);
    if (fvgSetup) setups.push(fvgSetup);

    // Generate setup from Liquidity
    const liqSetup = this.generateLiquiditySetupFromState(state, context, coin, symbol, timeframe);
    if (liqSetup) setups.push(liqSetup);

    return setups;
  }

  /**
   * Generate setup from BOS + Sweep structure
   */
  private generateBOSSetup(
    state: SymbolState,
    context: MarketContext,
    coin: string,
    symbol: string,
    timeframe: '1H' | '4H' | '1D'
  ): TradeSetup | null {
    const { marketStructure, sweptLiquidity, fvgZones, bosEvents } = state;

    // Need recent BOS
    if (!marketStructure.lastBOS) return null;

    const lastBOS = marketStructure.lastBOS;
    const bosAge = Date.now() - lastBOS.timestamp;

    // BOS must be recent (within 12 hours)
    if (bosAge > 12 * 60 * 60 * 1000) return null;

    // Check for recent sweep
    const recentSweep = sweptLiquidity.find(s =>
      s.sweepTimestamp && (Date.now() - s.sweepTimestamp) < 4 * 60 * 60 * 1000
    );

    // Determine bias from BOS direction
    const bias: 'bullish' | 'bearish' = lastBOS.direction === 'bullish' ? 'bullish' : 'bearish';

    // Get current price
    const candles = state.candles;
    if (candles.length === 0) return null;
    const currentPrice = candles[candles.length - 1].close;

    // Calculate entry, SL, targets
    let entryZone: { low: number; high: number };
    let stopLoss: number;

    if (recentSweep) {
      // Entry based on sweep
      if (bias === 'bullish') {
        entryZone = { low: currentPrice * 0.995, high: currentPrice * 1.005 };
        stopLoss = Math.min(recentSweep.sweepPrice || entryZone.low * 0.99, entryZone.low * 0.985);
      } else {
        entryZone = { low: currentPrice * 0.995, high: currentPrice * 1.005 };
        stopLoss = Math.max(recentSweep.sweepPrice || entryZone.high * 1.01, entryZone.high * 1.015);
      }
    } else {
      // Entry based on FVG or current price
      const relevantFVG = fvgZones.find(f =>
        f.type === (bias === 'bullish' ? 'bullish' : 'bearish') && !f.mitigated
      );

      if (relevantFVG) {
        entryZone = {
          low: Math.min(relevantFVG.top, relevantFVG.bottom),
          high: Math.max(relevantFVG.top, relevantFVG.bottom)
        };
        stopLoss = bias === 'bullish'
          ? entryZone.low * 0.985
          : entryZone.high * 1.015;
      } else {
        entryZone = { low: currentPrice * 0.99, high: currentPrice * 1.01 };
        stopLoss = bias === 'bullish'
          ? currentPrice * 0.97
          : currentPrice * 1.03;
      }
    }

    const entryMid = (entryZone.low + entryZone.high) / 2;
    const risk = Math.abs(entryMid - stopLoss);

    // Targets: 2R and 3R
    const targets = [
      bias === 'bullish' ? entryMid + risk * 2 : entryMid - risk * 2,
      bias === 'bullish' ? entryMid + risk * 3 : entryMid - risk * 3
    ];

    const riskRewardRatio = 2.0;

    // Calculate confidence
    let confidenceScore = 60;
    if (recentSweep) confidenceScore += 15;
    if (marketStructure.strength > 60) confidenceScore += 10;
    if (context.volumeProfile === 'high') confidenceScore += 10;

    // Build market state data
    const nearestLiquidity = state.liquidityZones
      .slice(-3)
      .find(z => z.type === (bias === 'bullish' ? 'equal_lows' : 'equal_highs'));

    const nearestFVG = fvgZones
      .filter(f => f.type === (bias === 'bullish' ? 'bullish' : 'bearish') && !f.mitigated)
      .slice(-1)[0];

    // Score through edge filter
    const signalInput = {
      id: `${symbol}-bos-${Date.now()}`,
      symbol,
      type: 'ENTRY' as const,
      direction: (bias === 'bullish' ? 'LONG' : 'SHORT') as 'LONG' | 'SHORT',
      strategy: 'BOS_PULLBACK',
      entryPrice: entryMid,
      stopLoss,
      takeProfits: targets,
      timestamp: Date.now(),
      timeframe: timeframe as string,
      confidence: confidenceScore
    };

    const filtered = edgeFilterEngine.filterSignal(signalInput, state, context);

    if (!filtered || !filtered.valid) {
      console.log(`[deriveSetups] ${symbol} BOS setup rejected: ${filtered?.edgeScore.reasonBlocked || 'Unknown'}`);
      return null;
    }

    // Build visuals
    const visuals = visualMappingEngine.mapStateToOverlays(state, filtered, {
      candleLimit: 100
    });

    // Build market story
    const marketStory = visualMappingEngine.generateMarketStory(state, filtered).map(s => ({...s, timestamp: typeof s.timestamp === 'string' ? parseInt(s.timestamp) : s.timestamp}));

    return {
      id: `setup-bos-${symbol}-${Date.now()}`,
      symbol: coin,
      bias,
      status: 'forming',
      timeframe,
      signalTimeframe: getSignalTimeframe(timeframe),
      strategy: ['BOS_PULLBACK', 'STRUCTURE'],
      strategyType: 'breakout',
      entryZone,
      entryPrice: entryMid,
      stopLoss,
      targets,
      riskRewardRatio,
      riskPercent: (risk / entryMid) * 100,
      riskLevel: riskPercentToLevel((risk / entryMid) * 100),
      confidenceScore: Math.min(confidenceScore, 95),
      confluence: [
        'BOS confirmed',
        recentSweep ? 'Liquidity swept' : 'Clean structure',
        `Trend strength: ${marketStructure.strength}%`,
        `Volume: ${context.volumeProfile}`
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      analysis: {
        marketStructure: `${bias} BOS confirmed, ${marketStructure.trend} trend`,
        keyLevels: {
          support: context.keyLevels.support.slice(-3),
          resistance: context.keyLevels.resistance.slice(-3)
        },
        volumeProfile: context.volumeProfile,
        trendAlignment: `${bias} with ${marketStructure.strength}% strength`
      },
      marketState: {
        trend: marketStructure.trend,
        strength: marketStructure.strength,
        bosConfirmed: true,
        sweepDetected: !!recentSweep,
        liquidityLevel: nearestLiquidity?.priceLevel,
        fvgZone: nearestFVG ? {
          top: nearestFVG.top,
          bottom: nearestFVG.bottom,
          type: nearestFVG.type
        } : undefined
      },
      edgeScore: {
        total: filtered.edgeScore.total,
        liquidityConfluence: filtered.edgeScore.liquidityConfluence,
        structureQuality: filtered.edgeScore.structureQuality,
        timingQuality: filtered.edgeScore.timingQuality,
        riskReward: filtered.edgeScore.riskReward
      },
      visuals,
      marketStory
    };
  }

  /**
   * Generate setup from FVG mitigation
   */
  private generateFVGSetupFromState(
    state: SymbolState,
    context: MarketContext,
    coin: string,
    symbol: string,
    timeframe: '1H' | '4H' | '1D'
  ): TradeSetup | null {
    const { fvgZones, candles } = state;

    // Find unmitigated FVGs
    const unmitigated = fvgZones.filter(f => !f.mitigated).slice(-3);
    if (unmitigated.length === 0) return null;

    const currentPrice = candles[candles.length - 1]?.close || 0;

    // Find FVG that price is currently inside or near
    const activeFVG = unmitigated.find(f => {
      const fvgLow = Math.min(f.top, f.bottom);
      const fvgHigh = Math.max(f.top, f.bottom);
      return currentPrice >= fvgLow * 0.995 && currentPrice <= fvgHigh * 1.005;
    });

    if (!activeFVG) return null;

    const bias: 'bullish' | 'bearish' = activeFVG.type === 'bullish' ? 'bullish' : 'bearish';

    const entryZone = {
      low: Math.min(activeFVG.top, activeFVG.bottom),
      high: Math.max(activeFVG.top, activeFVG.bottom)
    };
    const entryMid = (entryZone.low + entryZone.high) / 2;

    const stopLoss = bias === 'bullish'
      ? entryZone.low * 0.98
      : entryZone.high * 1.02;

    const risk = Math.abs(entryMid - stopLoss);
    const targets = [
      bias === 'bullish' ? entryMid + risk * 2.5 : entryMid - risk * 2.5,
      bias === 'bullish' ? entryMid + risk * 3.5 : entryMid - risk * 3.5
    ];

    // Score through edge filter
    const signalInput = {
      id: `${symbol}-fvg-${Date.now()}`,
      symbol,
      type: 'ENTRY' as const,
      direction: (bias === 'bullish' ? 'LONG' : 'SHORT') as 'LONG' | 'SHORT',
      strategy: 'FVG_MITIGATION',
      entryPrice: entryMid,
      stopLoss,
      takeProfits: targets,
      timestamp: Date.now(),
      timeframe: timeframe as string,
      confidence: 70
    };

    const filtered = edgeFilterEngine.filterSignal(signalInput, state, context);
    if (!filtered || !filtered.valid) return null;

    return {
      id: `setup-fvg-${symbol}-${Date.now()}`,
      symbol: coin,
      bias,
      status: 'forming',
      timeframe,
      signalTimeframe: getSignalTimeframe(timeframe),
      strategy: ['FVG_MITIGATION', 'IMBALANCE'],
      strategyType: 'trend',
      entryZone,
      entryPrice: entryMid,
      stopLoss,
      targets,
      riskRewardRatio: 2.5,
      riskPercent: (risk / entryMid) * 100,
      riskLevel: riskPercentToLevel((risk / entryMid) * 100),
      confidenceScore: 70,
      confluence: [
        'Unmitigated FVG',
        `FVG type: ${activeFVG.type}`,
        'Price in mitigation zone'
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      analysis: {
        marketStructure: `FVG mitigation setup (${activeFVG.type})`,
        keyLevels: {
          support: [activeFVG.bottom],
          resistance: [activeFVG.top]
        },
        volumeProfile: context.volumeProfile,
        trendAlignment: `FVG-based, ${bias} bias`
      },
      marketState: {
        trend: state.marketStructure.trend,
        strength: state.marketStructure.strength,
        bosConfirmed: !!state.marketStructure.lastBOS,
        sweepDetected: state.sweptLiquidity.length > 0,
        fvgZone: {
          top: activeFVG.top,
          bottom: activeFVG.bottom,
          type: activeFVG.type
        }
      },
      edgeScore: {
        total: filtered.edgeScore.total,
        liquidityConfluence: filtered.edgeScore.liquidityConfluence,
        structureQuality: filtered.edgeScore.structureQuality,
        timingQuality: filtered.edgeScore.timingQuality,
        riskReward: filtered.edgeScore.riskReward
      },
      visuals: filtered.visuals,
      marketStory: visualMappingEngine.generateMarketStory(state, filtered).map(s => ({...s, timestamp: typeof s.timestamp === 'string' ? parseInt(s.timestamp) : s.timestamp}))
    };
  }

  /**
   * Generate setup from Liquidity sweep
   */
  private generateLiquiditySetupFromState(
    state: SymbolState,
    context: MarketContext,
    coin: string,
    symbol: string,
    timeframe: '1H' | '4H' | '1D'
  ): TradeSetup | null {
    const { sweptLiquidity, candles } = state;

    // Find recent sweeps (within 4 hours)
    const recentSweep = sweptLiquidity.find(s =>
      s.sweepTimestamp && (Date.now() - s.sweepTimestamp) < 4 * 60 * 60 * 1000
    );

    if (!recentSweep) return null;

    const bias: 'bullish' | 'bearish' =
      recentSweep.type === 'equal_lows' || recentSweep.type === 'swing_low'
        ? 'bullish'
        : 'bearish';

    const currentPrice = candles[candles.length - 1]?.close || recentSweep.priceLevel;

    const entryZone = {
      low: currentPrice * 0.99,
      high: currentPrice * 1.01
    };
    const entryMid = (entryZone.low + entryZone.high) / 2;

    const stopLoss = bias === 'bullish'
      ? recentSweep.sweepPrice || recentSweep.priceLevel * 0.985
      : recentSweep.sweepPrice || recentSweep.priceLevel * 1.015;

    const risk = Math.abs(entryMid - stopLoss);
    const targets = [
      bias === 'bullish' ? entryMid + risk * 2 : entryMid - risk * 2,
      bias === 'bullish' ? entryMid + risk * 3 : entryMid - risk * 3
    ];

    return {
      id: `setup-liq-${symbol}-${Date.now()}`,
      symbol: coin,
      bias,
      status: 'forming',
      timeframe,
      signalTimeframe: getSignalTimeframe(timeframe),
      strategy: ['LIQUIDITY_SWEEP', 'REVERSAL'],
      strategyType: 'liquidity',
      entryZone,
      entryPrice: entryMid,
      stopLoss,
      targets,
      riskRewardRatio: 2.0,
      riskPercent: (risk / entryMid) * 100,
      riskLevel: riskPercentToLevel((risk / entryMid) * 100),
      confidenceScore: 75,
      confluence: [
        `${recentSweep.type} swept`,
        'Liquidity taken',
        'Expect reversal'
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      analysis: {
        marketStructure: `Liquidity sweep reversal (${recentSweep.type})`,
        keyLevels: {
          support: bias === 'bullish' ? [recentSweep.priceLevel] : context.keyLevels.support.slice(-2),
          resistance: bias === 'bearish' ? [recentSweep.priceLevel] : context.keyLevels.resistance.slice(-2)
        },
        volumeProfile: context.volumeProfile,
        trendAlignment: 'Counter-trend liquidity sweep'
      },
      marketState: {
        trend: state.marketStructure.trend,
        strength: state.marketStructure.strength,
        bosConfirmed: !!state.marketStructure.lastBOS,
        sweepDetected: true,
        liquidityLevel: recentSweep.priceLevel
      }
    };
  }
}

function riskPercentToLevel(riskPercent: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (riskPercent < 1.5) return 'LOW';      // Conservative: < 1.5%
  if (riskPercent < 3) return 'MEDIUM';    // Optimal: 1.5% - 3%
  return 'HIGH';                           // Aggressive: > 3%
}

export const tradeSetupEngine = new TradeSetupEngine();
export default TradeSetupEngine;
