import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Zap, Copy, ExternalLink, Target, BarChart3, Percent } from 'lucide-react'
import MiniTradingViewChart from './MiniTradingViewChart'

interface Signal {
  id: string
  coin: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryMin: number
  entryMax: number
  stopLoss: number
  target1: number
  target2?: number
  target3?: number
  confidence: number
  setupType: string
  timeframe: string
  strategy: string
  status: 'FORMING' | 'TRIGGERED' | 'EXPIRED' | 'SUCCESS' | 'FAILED'
  ema50?: number
  ema200?: number
  rsi?: number
  volume?: number
  volumeAvg?: number
  createdAt: string
  updatedAt: string
  triggeredAt?: string
  expiresAt: string
  entryPrice?: number
  exitPrice?: number
  pnlPercent?: number
  isPreview?: boolean
  // Backward compatibility
  entry?: number
  takeProfit?: number
  winRate?: number
  reasoning?: string
}

interface SignalCardProps {
  signal: Signal
  onSelect?: (signal: Signal) => void
  onSendAlert?: (signal: Signal) => void
  sendingAlert?: boolean
  telegramEnabled?: boolean
}

export default function SignalCard({ signal, onSelect, onSendAlert, sendingAlert, telegramEnabled }: SignalCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isNew, setIsNew] = useState(false)
  const [_chartData, setChartData] = useState<{time: string, value: number}[]>([])

  // Use new fields with fallback to old fields for backward compatibility
  const entry = signal.entry || ((signal.entryMin + signal.entryMax) / 2)
  const takeProfit = signal.takeProfit || signal.target1
  const stopLoss = signal.stopLoss
  const strategy = signal.setupType || signal.strategy || 'Technical Analysis'
  const timeframe = signal.timeframe || '4H'
  const status = signal.status || 'FORMING'

  useEffect(() => {
    // Check if signal is new (< 5 minutes)
    const created = new Date(signal.createdAt).getTime()
    const now = Date.now()
    const minutesSinceCreated = (now - created) / (1000 * 60)
    setIsNew(minutesSinceCreated < 5)

    // Calculate countdown timer
    const updateTimer = () => {
      if (signal.expiresAt) {
        const expiry = new Date(signal.expiresAt).getTime()
        const diff = expiry - Date.now()
        if (diff > 0) {
          const minutes = Math.floor(diff / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft('Expired')
        }
      } else {
        // Default 2 hour expiry from creation
        const expiry = new Date(signal.createdAt).getTime() + (2 * 60 * 60 * 1000)
        const diff = expiry - Date.now()
        if (diff > 0) {
          const minutes = Math.floor(diff / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft('Expired')
        }
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [signal])

  // Fetch real price data for chart
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Get price data from CoinGecko or Binance
        const coinId = signal.coin.replace('USDT', '').toLowerCase()
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`
        )
        if (response.ok) {
          const data = await response.json()
          const prices = data.prices.slice(-24) // Last 24 hours
          const formatted = prices.map((p: [number, number], i: number) => ({
            time: new Date(p[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: p[1],
            index: i
          }))
          setChartData(formatted)
        } else {
          // Fallback: generate realistic price movement based on entry
          generateFallbackChart()
        }
      } catch (error) {
        generateFallbackChart()
      }
    }

    const generateFallbackChart = () => {
      const points = 24
      const newData = []
      let price = entry * 0.98 // Start slightly below entry
      
      for (let i = 0; i < points; i++) {
        // Add realistic price volatility
        const volatility = 0.002 // 0.2% volatility
        const trend = (entry - price) * 0.05 // Trend toward entry
        const change = trend + (Math.random() - 0.5) * volatility * price
        price = price * (1 + change)
        
        newData.push({
          time: `${i}h`,
          value: price,
          index: i
        })
      }
      // Ensure last point shows current price near entry
      newData[points - 1].value = entry
      setChartData(newData)
    }

    fetchChartData()
  }, [signal, entry])

  const handleCopyTrade = () => {
    const text = `${signal.coin.replace('USDT', '')} ${signal.direction} | Entry: ${entry.toFixed(2)} | SL: ${stopLoss.toFixed(2)} | TP: ${takeProfit.toFixed(2)}`
    navigator.clipboard.writeText(text)
  }

  const calculateRiskPercent = () => {
    const risk = Math.abs(entry - stopLoss)
    const riskPercent = (risk / entry) * 100
    return riskPercent.toFixed(2)
  }

  const getRiskBadge = () => {
    const riskPercent = parseFloat(calculateRiskPercent())
    if (riskPercent < 2) return { text: 'LOW RISK', color: 'bg-neon-green/20 text-neon-green border-neon-green/50' }
    if (riskPercent < 4) return { text: 'MEDIUM', color: 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/50' }
    return { text: 'HIGH RISK', color: 'bg-red-400/20 text-red-400 border-red-400/50' }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'FORMING':
        return { text: 'FORMING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' }
      case 'TRIGGERED':
        return { text: 'TRIGGERED', color: 'bg-neon-green/20 text-neon-green border-neon-green/50' }
      case 'EXPIRED':
        return { text: 'EXPIRED', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' }
      case 'SUCCESS':
        return { text: 'SUCCESS', color: 'bg-neon-green/20 text-neon-green border-neon-green/50' }
      case 'FAILED':
        return { text: 'FAILED', color: 'bg-red-400/20 text-red-400 border-red-400/50' }
      default:
        return { text: 'FORMING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' }
    }
  }

  const riskBadge = getRiskBadge()
  const statusBadge = getStatusBadge()

  // Calculate Risk/Reward ratio
  const calculateRR = () => {
    const risk = Math.abs(entry - stopLoss)
    const reward = Math.abs(takeProfit - entry)
    return (reward / risk).toFixed(1)
  }

  // Calculate potential profit %
  const calculateProfitPercent = () => {
    const profit = Math.abs(takeProfit - entry)
    return ((profit / entry) * 100).toFixed(1)
  }

  // Get exchange URL
  const getExchangeUrl = (exchange: string) => {
    const coin = signal.coin.replace('USDT', '')
    const urls: { [key: string]: string } = {
      binance: `https://www.binance.com/en/trade/${coin}_USDT`,
      bybit: `https://www.bybit.com/trade/usdt/${coin}USDT`,
      okx: `https://www.okx.com/trade-spot/${coin}-USDT`
    }
    return urls[exchange] || '#'
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: signal.direction === 'LONG' 
        ? '0 0 30px rgba(34, 197, 94, 0.3)' 
        : '0 0 30px rgba(239, 68, 68, 0.3)'
      }}
      className={`glass rounded-xl p-4 border transition-all duration-300 ${
        signal.direction === 'LONG' 
          ? 'border-neon-green/30 hover:border-neon-green/60' 
          : 'border-red-400/30 hover:border-red-400/60'
      }`}
    >
      {/* Header - Coin & Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
            signal.direction === 'LONG' 
              ? 'bg-gradient-to-br from-neon-green/30 to-neon-green/10' 
              : 'bg-gradient-to-br from-red-400/30 to-red-400/10'
          }`}>
            <img 
              src={`https://assets.coingecko.com/coins/images/1/small/${signal.coin.toLowerCase().replace('usdt', '').replace('usd', '')}.png`}
              alt={signal.coin}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback to arrow if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.innerHTML = signal.direction === 'LONG' 
                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>';
                  parent.appendChild(fallback.firstChild!);
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight">{signal.coin.replace('USDT', '')}</h3>
              {isNew && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-[10px] font-bold rounded-full animate-pulse flex items-center gap-1">
                  <Zap size={10} />
                  NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 bg-dark-600 rounded text-neon-cyan font-semibold">
                {timeframe}
              </span>
              <span className="px-1.5 py-0.5 rounded border font-semibold text-[10px]">
                <span className={statusBadge.color}>{statusBadge.text}</span>
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400 flex items-center gap-1">
                <Clock size={10} />
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
        
        <div className={`group/tooltip relative px-3 py-1.5 rounded-lg font-bold text-sm border cursor-help ${
          signal.direction === 'LONG' 
            ? 'bg-neon-green/20 text-neon-green border-neon-green/50' 
            : 'bg-red-400/20 text-red-400 border-red-400/50'
        }`}>
          {signal.direction}
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            <div className="font-semibold text-neon-cyan mb-1">{strategy}</div>
            {(signal.reasoning || signal.strategy) && (
              <div className="text-gray-400">
                {signal.reasoning || signal.strategy}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategy Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
          <BarChart3 size={12} />
          {strategy}
        </span>
      </div>

      {/* Chart Section - Mini TradingView Widget */}
      <div className="relative h-28 mb-3 bg-dark-700/30 rounded-xl overflow-hidden group">
        <MiniTradingViewChart 
          symbol={signal.coin.replace('USDT', '').replace('USD', '')}
          theme="dark"
          strategy={[strategy]}
          timeframe={timeframe}
        />
        
        {/* Hover Overlay with Trade Button */}
        <div className="absolute inset-0 bg-dark-800/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => onSelect?.(signal)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-lg ${
              signal.direction === 'LONG'
                ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-white'
                : 'bg-gradient-to-r from-red-400 to-red-600 text-white'
            }`}
          >
            {signal.direction} Trade
          </button>
          <div className="mt-2 text-xs text-neon-cyan font-semibold">
            Entry: ${entry.toLocaleString(undefined, {maximumFractionDigits: 2})}
          </div>
        </div>
      </div>

      {/* Price Levels - Compact Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-dark-700/50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Entry</div>
          <div className="text-sm font-bold text-neon-cyan">
            ${entry.toLocaleString(undefined, {maximumFractionDigits: entry > 1000 ? 0 : 2})}
          </div>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Stop Loss</div>
          <div className="text-sm font-bold text-red-400">
            ${stopLoss.toLocaleString(undefined, {maximumFractionDigits: stopLoss > 1000 ? 0 : 2})}
          </div>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Take Profit</div>
          <div className="text-sm font-bold text-neon-green">
            ${takeProfit.toLocaleString(undefined, {maximumFractionDigits: takeProfit > 1000 ? 0 : 2})}
          </div>
        </div>
      </div>

      {/* Stats Row - Risk, Profit %, R:R with Tooltips */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Risk Badge */}
        <div className="group/tooltip relative">
          <div className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-center cursor-help ${riskBadge.color}`}>
            {riskBadge.text}
          </div>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="font-semibold text-neon-cyan mb-1">Risk Assessment</div>
            <div className="text-gray-400">Risk: ${Math.abs(entry - stopLoss).toFixed(4)}</div>
            <div className="text-gray-500">{calculateRiskPercent()}% of entry price</div>
            <div className="text-gray-500 mt-1 text-[10px]">
              Less than 2% = Low | 2-4% = Medium | Greater than 4% = High
            </div>
          </div>
        </div>
        
        {/* Profit % Badge */}
        <div className="group/tooltip relative">
          <div className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-neon-green/10 text-neon-green border border-neon-green/30 text-center flex items-center justify-center gap-1 cursor-help">
            <Percent size={10} />
            +{calculateProfitPercent()}%
          </div>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="font-semibold text-neon-green mb-1">Potential Profit</div>
            <div className="text-gray-400">Profit: ${Math.abs(takeProfit - entry).toFixed(4)}</div>
            <div className="text-gray-500">{calculateProfitPercent()}% gain if target hit</div>
          </div>
        </div>
        
        {/* R:R Badge */}
        <div className="group/tooltip relative">
          <div className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 text-center flex items-center justify-center gap-1 cursor-help">
            <Target size={10} />
            R:R {calculateRR()}
          </div>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="font-semibold text-neon-cyan mb-1">Risk/Reward Ratio</div>
            <div className="text-gray-400">Risk ${Math.abs(entry - stopLoss).toFixed(4)}</div>
            <div className="text-gray-400">Reward ${Math.abs(takeProfit - entry).toFixed(4)}</div>
            <div className="text-gray-500 mt-1">Min 1:2 recommended</div>
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Confidence</span>
          <span className="font-semibold text-neon-purple">{signal.confidence}%</span>
        </div>
        <div className="w-full bg-dark-600 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-neon-cyan to-neon-purple h-1.5 rounded-full"
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* Exchange Quick Links */}
      <div className="flex gap-2 mb-3">
        <a
          href={`https://www.tradingview.com/chart/?symbol=BINANCE:${signal.coin}&interval=60`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <BarChart3 size={10} />
          TradingView
        </a>
        <a
          href={getExchangeUrl('binance')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <ExternalLink size={10} />
          Binance
        </a>
        <a
          href={getExchangeUrl('bybit')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 text-neon-purple py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <ExternalLink size={10} />
          Bybit
        </a>
      </div>

      {/* Actions with tooltips */}
      <div className="flex gap-2">
        {/* Copy Button */}
        <div className="group/tooltip relative flex-1">
          <button
            onClick={handleCopyTrade}
            className="w-full flex items-center justify-center gap-2 bg-dark-600 hover:bg-dark-500 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Copy size={14} />
            Copy
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            Copy trade details to clipboard
          </div>
        </div>
        
        {/* Send Alert Button */}
        {telegramEnabled && onSendAlert && (
          <div className="group/tooltip relative flex-1">
            <button
              onClick={() => onSendAlert(signal)}
              disabled={sendingAlert}
              className="w-full flex items-center justify-center gap-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 py-2 rounded-lg text-sm font-semibold hover:bg-neon-cyan/30 transition-colors disabled:opacity-50"
            >
              {sendingAlert ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock size={14} />
                </motion.div>
              ) : (
                <>
                  <ExternalLink size={14} />
                  Alert
                </>
              )}
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
              Send to Telegram (1 per coin per 10 min)
            </div>
          </div>
        )}
        
        {/* Trade Button */}
        <div className="group/tooltip relative flex-1">
          <button
            onClick={() => onSelect?.(signal)}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${
              signal.direction === 'LONG'
                ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-white'
                : 'bg-gradient-to-r from-red-400 to-red-600 text-white'
            }`}
          >
            Trade
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            View detailed analysis & execute trade
          </div>
        </div>
      </div>
    </motion.div>
  )
}
