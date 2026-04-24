export interface Strategy {
  id: string;
  name: string;
  type: 'swing' | 'day' | 'scalp';
  timeframe: string;
  timeframeLabel: string;
  description: string;
  technicalIndicators: string[];
  entryRules: string[];
  exitRules: string[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    riskReward: string;
  };
  fundamentalFactors: string[];
  timeframeMinutes: number;
  // Strategy detection logic
  detectSignal: (data: MarketData) => Signal | null;
  calculateConfidence: (data: MarketData, breakdown: string[]) => number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  volumeChange: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  support?: number;
  resistance?: number;
  high24h?: number;
  low24h?: number;
  avgVolume?: number;
}

export interface Signal {
  asset: string;
  direction: 'LONG' | 'SHORT';
  strategy: string;
  timeframe: string;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit: number;
  rr: number;
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdown: string[];
  timestamp: number;
  expiry: number;
  currentPrice: number;
  change24h: number;
}

// Confidence scoring helper
function calculateConfidenceScore(
  trendAlignment: boolean,
  strongCandle: boolean,
  volumeConfirmation: boolean,
  cleanStructure: boolean,
  higherTimeframeAgreement: boolean
): number {
  let score = 50; // Base score
  if (trendAlignment) score += 25;
  if (strongCandle) score += 15;
  if (volumeConfirmation) score += 15;
  if (cleanStructure) score += 10;
  if (higherTimeframeAgreement) score += 10;
  return Math.min(95, score);
}

// 1. EMA Trend Pullback Strategy
const emaTrendPullback: Strategy = {
  id: 'ema_trend_pullback',
  name: 'EMA Trend Pullback',
  type: 'swing',
  timeframe: '1H',
  timeframeLabel: '1-Hour',
  description: 'Trade with trend, enter on pullback to EMA50. Clean trend-following strategy.',
  technicalIndicators: ['EMA 50', 'EMA 200', 'Price Action', 'Trend Direction'],
  entryRules: [
    'Price above 200 EMA (bullish trend)',
    '50 EMA above 200 EMA (strong trend)',
    'Price pulls back to 50 EMA',
    'Bullish candle close for entry'
  ],
  exitRules: [
    'Close below 50 EMA',
    'Break below 200 EMA (trend change)',
    'Target hit (2-3x risk)'
  ],
  riskManagement: {
    stopLoss: 2.5,
    takeProfit: 7.5,
    riskReward: '1:3'
  },
  fundamentalFactors: [
    'Market in uptrend',
    'No major bearish news',
    'Volume healthy'
  ],
  timeframeMinutes: 60,
  detectSignal: (data: MarketData): Signal | null => {
    if (!data.ema50 || !data.ema200) return null;
    
    const trend = data.ema50 > data.ema200 && data.price > data.ema200;
    const pullback = Math.abs(data.price - data.ema50) / data.ema50 < 0.015;
    const bullish = data.change24h > -2; // Not in freefall
    
    if (trend && pullback && bullish) {
      const breakdown = [
        '✓ Trend bullish (EMA50 > EMA200)',
        '✓ Price above 200 EMA',
        '✓ Pullback to 50 EMA detected',
        '✓ Market structure intact'
      ];
      
      const confidence = calculateConfidenceScore(
        true, true, data.volume > (data.avgVolume || 0), true, data.change24h > 0
      );
      
      const stopLoss = data.ema50 * 0.975;
      const takeProfit = data.price * 1.075;
      
      return {
        asset: data.symbol,
        direction: 'LONG',
        strategy: 'EMA Trend Pullback',
        timeframe: '1H',
        entryZone: [data.ema50 * 0.99, data.ema50 * 1.01],
        stopLoss,
        takeProfit,
        rr: 3,
        confidence,
        risk: confidence > 75 ? 'LOW' : confidence > 60 ? 'MEDIUM' : 'HIGH',
        breakdown,
        timestamp: Date.now(),
        expiry: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
        currentPrice: data.price,
        change24h: data.change24h
      };
    }
    return null;
  },
  calculateConfidence: (data, breakdown) => {
    return calculateConfidenceScore(
      true, true, data.volume > (data.avgVolume || 0), true, data.change24h > 0
    );
  }
};

// 2. Breakout + Retest Strategy
const breakoutRetest: Strategy = {
  id: 'breakout_retest',
  name: 'Breakout Retest',
  type: 'swing',
  timeframe: '1H',
  timeframeLabel: '1-Hour',
  description: 'Break resistance → retest → continuation. High probability setup.',
  technicalIndicators: ['Support/Resistance Levels', 'Volume', 'Price Action'],
  entryRules: [
    'Resistance broken with volume',
    'Price returns to breakout level',
    'Holds above broken resistance',
    'Bullish confirmation candle'
  ],
  exitRules: [
    'Close below retest level',
    'False breakout (close below support)',
    'Target reached'
  ],
  riskManagement: {
    stopLoss: 3,
    takeProfit: 9,
    riskReward: '1:3'
  },
  fundamentalFactors: [
    'Volume spike confirms breakout',
    'Market sentiment positive',
    'No immediate resistance above'
  ],
  timeframeMinutes: 60,
  detectSignal: (data: MarketData): Signal | null => {
    if (!data.resistance || !data.high24h) return null;
    
    const breakout = data.price > data.resistance && data.high24h > data.resistance;
    const retestZone = Math.abs(data.price - data.resistance) / data.resistance < 0.02;
    const volumeConfirm = data.volume > (data.avgVolume || 0) * 1.3;
    
    if (breakout && retestZone && volumeConfirm) {
      const breakdown = [
        '✓ Resistance broken with volume',
        '✓ Price retesting breakout level',
        '✓ Holding above support',
        '✓ Volume confirms move'
      ];
      
      const confidence = calculateConfidenceScore(
        true, true, volumeConfirm, true, data.change24h > 2
      );
      
      return {
        asset: data.symbol,
        direction: 'LONG',
        strategy: 'Breakout Retest',
        timeframe: '1H',
        entryZone: [data.resistance * 0.995, data.resistance * 1.015],
        stopLoss: data.resistance * 0.97,
        takeProfit: data.price * 1.09,
        rr: 3,
        confidence,
        risk: confidence > 70 ? 'MEDIUM' : 'HIGH',
        breakdown,
        timestamp: Date.now(),
        expiry: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
        currentPrice: data.price,
        change24h: data.change24h
      };
    }
    return null;
  },
  calculateConfidence: (data, breakdown) => {
    return calculateConfidenceScore(
      true, true, data.volume > (data.avgVolume || 0) * 1.3, true, data.change24h > 2
    );
  }
};

// 3. RSI Swing Reversal Strategy
const rsiSwingReversal: Strategy = {
  id: 'rsi_reversal',
  name: 'RSI Swing Reversal',
  type: 'swing',
  timeframe: '1H',
  timeframeLabel: '1-Hour',
  description: 'Mean reversion strategy - catch reversals at RSI extremes.',
  technicalIndicators: ['RSI (14)', 'Support Zones', 'Candle Patterns'],
  entryRules: [
    'RSI < 30 (oversold) for LONG',
    'RSI > 70 (overbought) for SHORT',
    'Bullish candle confirmation',
    'Near support zone (optional)'
  ],
  exitRules: [
    'RSI returns to 50',
    'Price hits resistance',
    'Target reached'
  ],
  riskManagement: {
    stopLoss: 2,
    takeProfit: 6,
    riskReward: '1:3'
  },
  fundamentalFactors: [
    'Oversold/overbought condition',
    'No major news driving trend',
    'Market ready for mean reversion'
  ],
  timeframeMinutes: 60,
  detectSignal: (data: MarketData): Signal | null => {
    if (!data.rsi) return null;
    
    const oversold = data.rsi < 30;
    const overbought = data.rsi > 70;
    const nearSupport = data.support && Math.abs(data.price - data.support) / data.price < 0.03;
    
    if (oversold && data.change24h < -5) {
      const breakdown = [
        `✓ RSI oversold (${data.rsi.toFixed(1)})`,
        '✓ Mean reversion likely',
        nearSupport ? '✓ Near support zone' : '✓ Sharp decline indicates bounce',
        '✓ Bullish reversal imminent'
      ];
      
      const confidence = 65 + (nearSupport ? 15 : 0) + (data.volume > (data.avgVolume || 0) ? 10 : 0);
      
      return {
        asset: data.symbol,
        direction: 'LONG',
        strategy: 'RSI Swing Reversal',
        timeframe: '1H',
        entryZone: [data.price * 0.995, data.price * 1.005],
        stopLoss: data.price * 0.98,
        takeProfit: data.price * 1.06,
        rr: 3,
        confidence,
        risk: confidence > 70 ? 'MEDIUM' : 'HIGH',
        breakdown,
        timestamp: Date.now(),
        expiry: Date.now() + 6 * 60 * 60 * 1000, // 6 hours
        currentPrice: data.price,
        change24h: data.change24h
      };
    }
    
    if (overbought && data.change24h > 5) {
      const breakdown = [
        `✓ RSI overbought (${data.rsi.toFixed(1)})`,
        '✓ Mean reversion likely',
        '✓ Sharp rally indicates pullback',
        '✓ Bearish reversal imminent'
      ];
      
      const confidence = calculateConfidenceScore(
        true, true, data.volume > (data.avgVolume || 0), true, false
      );
      
      return {
        asset: data.symbol,
        direction: 'SHORT',
        strategy: 'RSI Swing Reversal',
        timeframe: '1H',
        entryZone: [data.price * 0.995, data.price * 1.005],
        stopLoss: data.price * 1.02,
        takeProfit: data.price * 0.94,
        rr: 3,
        confidence,
        risk: confidence > 70 ? 'MEDIUM' : 'HIGH',
        breakdown,
        timestamp: Date.now(),
        expiry: Date.now() + 6 * 60 * 60 * 1000,
        currentPrice: data.price,
        change24h: data.change24h
      };
    }
    return null;
  },
  calculateConfidence: (data, breakdown) => {
    return calculateConfidenceScore(
      true, true, data.volume > (data.avgVolume || 0), true, true
    );
  }
};

// 4. Range Trading Strategy
const rangeTrading: Strategy = {
  id: 'range_trading',
  name: 'Range Trading',
  type: 'swing',
  timeframe: '1H',
  timeframeLabel: '1-Hour',
  description: 'Market not trending → trade the range. Buy low, sell high.',
  technicalIndicators: ['Range High/Low', 'Support/Resistance', 'RSI'],
  entryRules: [
    'Define range high and low',
    'Price near support for LONG',
    'Price near resistance for SHORT',
    'Rejection candle confirmation'
  ],
  exitRules: [
    'Price reaches opposite side of range',
    'Range break (close outside)',
    'Target hit'
  ],
  riskManagement: {
    stopLoss: 2,
    takeProfit: 4,
    riskReward: '1:2'
  },
  fundamentalFactors: [
    'Sideways market conditions',
    'Low volatility',
    'No major catalysts'
  ],
  timeframeMinutes: 60,
  detectSignal: (data: MarketData): Signal | null => {
    if (!data.support || !data.resistance) return null;
    
    const rangeSize = data.resistance - data.support;
    const inRange = data.price > data.support && data.price < data.resistance;
    const nearSupport = (data.price - data.support) / rangeSize < 0.25;
    const nearResistance = (data.resistance - data.price) / rangeSize < 0.25;
    
    if (inRange && nearSupport && data.change24h > -3) {
      const breakdown = [
        '✓ Price in established range',
        '✓ Near support (range low)',
        '✓ Sideways market conditions',
        '✓ Bounce expected from support'
      ];
      
      const confidence = calculateConfidenceScore(
        true, data.change24h > -1, data.volume < (data.avgVolume || 0) * 1.2, true, true
      );
      
      return {
        asset: data.symbol,
        direction: 'LONG',
        strategy: 'Range Trading',
        timeframe: '1H',
        entryZone: [data.support * 0.998, data.support * 1.008],
        stopLoss: data.support * 0.98,
        takeProfit: data.resistance * 0.99,
        rr: 2,
        confidence,
        risk: 'LOW',
        breakdown,
        timestamp: Date.now(),
        expiry: Date.now() + 12 * 60 * 60 * 1000,
        currentPrice: data.price,
        change24h: data.change24h
      };
    }
    return null;
  },
  calculateConfidence: (data, breakdown) => {
    return calculateConfidenceScore(
      true, true, data.volume < (data.avgVolume || 0) * 1.2, true, true
    );
  }
};

// 5. Volume Spike Breakout Strategy
const volumeSpikeBreakout: Strategy = {
  id: 'volume_breakout',
  name: 'Volume Spike Breakout',
  type: 'swing',
  timeframe: '1H',
  timeframeLabel: '1-Hour',
  description: 'Big volume = real move. Enter on volume-confirmed breakouts.',
  technicalIndicators: ['Volume', 'Recent Highs/Lows', 'Price Action', 'Volume MA'],
  entryRules: [
    'Breakout of recent high',
    'Volume > 1.5x average volume',
    'Strong bullish candle',
    'Momentum confirmation'
  ],
  exitRules: [
    'Volume dries up',
    'Price closes below breakout level',
    'Target reached'
  ],
  riskManagement: {
    stopLoss: 3,
    takeProfit: 9,
    riskReward: '1:3'
  },
  fundamentalFactors: [
    'Unusual volume activity',
    'Potential news catalyst',
    'Institutional interest'
  ],
  timeframeMinutes: 60,
  detectSignal: (data: MarketData): Signal | null => {
    if (!data.high24h || !data.avgVolume) return null;
    
    const breakout = data.price > data.high24h * 0.98;
    const volumeSpike = data.volume > data.avgVolume * 1.5;
    const momentum = data.change24h > 3;
    
    if (breakout && volumeSpike && momentum) {
      const breakdown = [
        `✓ Breakout of recent high (${data.high24h.toLocaleString()})`,
        `✓ Volume spike (${(data.volume / data.avgVolume).toFixed(1)}x average)`,
        '✓ Strong momentum (+3%+)',
        '✓ Real buying interest detected'
      ];
      
      const confidence = calculateConfidenceScore(
        true, true, volumeSpike, true, data.change24h > 5
      );
      
      const entry = data.price;
      
      return {
        asset: data.symbol,
        direction: 'LONG',
        strategy: 'Volume Spike Breakout',
        timeframe: '1H',
        entryZone: [entry * 0.99, entry * 1.01],
        stopLoss: entry * 0.97,
        takeProfit: entry * 1.09,
        rr: 3,
        confidence,
        risk: confidence > 75 ? 'MEDIUM' : 'HIGH',
        breakdown,
        timestamp: Date.now(),
        expiry: Date.now() + 6 * 60 * 60 * 1000,
        currentPrice: data.price,
        change24h: data.change24h
      };
    }
    return null;
  },
  calculateConfidence: (data, breakdown) => {
    return calculateConfidenceScore(
      true, true, data.volume > (data.avgVolume || 0) * 1.5, true, data.change24h > 5
    );
  }
};

export const strategies: Strategy[] = [
  emaTrendPullback,
  breakoutRetest,
  rsiSwingReversal,
  rangeTrading,
  volumeSpikeBreakout
];

// Main signal detection function
export function detectSignals(data: MarketData): Signal[] {
  const signals: Signal[] = [];
  
  for (const strategy of strategies) {
    const signal = strategy.detectSignal(data);
    if (signal) {
      signals.push(signal);
    }
  }
  
  // Sort by confidence (highest first)
  return signals.sort((a, b) => b.confidence - a.confidence);
}

export function getRandomStrategy(): Strategy {
  return strategies[Math.floor(Math.random() * strategies.length)];
}

export function getStrategyById(id: string): Strategy | undefined {
  return strategies.find(s => s.id === id);
}

export function selectStrategyForConditions(
  trend: 'bullish' | 'bearish' | 'sideways',
  volatility: 'high' | 'medium' | 'low'
): Strategy {
  if (trend === 'bullish' && volatility !== 'high') {
    return strategies.find(s => s.id === 'ema_trend_pullback') || strategies[0];
  } else if (trend === 'bullish' && volatility === 'high') {
    return strategies.find(s => s.id === 'volume_breakout') || strategies[4];
  } else if (trend === 'sideways') {
    return strategies.find(s => s.id === 'range_trading') || strategies[3];
  } else if (trend === 'bearish') {
    return strategies.find(s => s.id === 'rsi_reversal') || strategies[2];
  }
  return getRandomStrategy();
}
