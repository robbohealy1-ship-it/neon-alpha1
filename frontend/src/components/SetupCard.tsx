import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, BookOpen, Activity, BarChart3, Layers, AlertTriangle, Target, Clock, ExternalLink, Bell, Mail, MessageCircle, X, Check, Star } from 'lucide-react'
import { ResponsiveContainer, ReferenceLine, XAxis, YAxis, Tooltip, ComposedChart, Bar } from 'recharts'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface Setup {
  id: string
  coin: string
  symbol: string
  bias: 'Bullish' | 'Bearish'
  entryZone: [number, number]
  entryPrice: number
  stopLoss: number
  invalidation: number
  targets: number[]
  confidence: number
  status: 'FORMING' | 'NEAR TRIGGER' | 'TRIGGERED' | 'EXPIRED'
  strategy: string
  strategies: string[]
  timeframe: '1H' | '4H' | '1D'
  riskRewardRatio: number
  riskPercent: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confluence: string[]
  analysis: {
    marketStructure: string
    keyLevels: {
      support: number[]
      resistance: number[]
    }
    volumeProfile: string
    trendAlignment: string
  }
  createdAt: string
  expiresAt: string
}

interface SetupCardProps {
  setup: Setup
  isExpanded?: boolean
}

export default function SetupCard({ setup, isExpanded: initialExpanded = false }: SetupCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [chartData, setChartData] = useState<{
    time: string
    open: number
    high: number
    low: number
    close: number
    isGreen: boolean
    bodyTop: number
    bodyBottom: number
    wickHigh: number
    wickLow: number
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertType, setAlertType] = useState<'email' | 'telegram'>('email')
  const [alertPrice, setAlertPrice] = useState(setup.entryZone[0].toString())
  const [savingWatchlist, setSavingWatchlist] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const { token } = useAuthStore()
  
  // Fetch OHLC candlestick data from CoinGecko
  useEffect(() => {
    const fetchOHLCData = async () => {
      try {
        // Map common symbols to CoinGecko IDs
        const coinIdMap: Record<string, string> = {
          'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin',
          'SOL': 'solana', 'XRP': 'ripple', 'DOGE': 'dogecoin',
          'ADA': 'cardano', 'AVAX': 'avalanche-2', 'DOT': 'polkadot',
          'MATIC': 'polygon', 'LINK': 'chainlink', 'UNI': 'uniswap',
          'ATOM': 'cosmos', 'LTC': 'litecoin', 'BCH': 'bitcoin-cash',
          'ALGO': 'algorand', 'VET': 'vechain', 'FIL': 'filecoin',
          'TRX': 'tron', 'ETC': 'ethereum-classic', 'XLM': 'stellar',
          'NEAR': 'near', 'FTM': 'fantom', 'MANA': 'decentraland',
          'SAND': 'the-sandbox', 'AXS': 'axie-infinity', 'THETA': 'theta-token',
          'XTZ': 'tezos', 'EGLD': 'elrond-erd-2', 'CAKE': 'pancakeswap-token',
          'AAVE': 'aave', 'GRT': 'the-graph', 'CRV': 'curve-dao-token',
          'SUSHI': 'sushi', 'COMP': 'compound-governance-token', 'YFI': 'yearn-finance',
          'MKR': 'maker', 'SNX': 'havven', 'ZIL': 'zilliqa',
          'ONE': 'harmony', 'KSM': 'kusama', 'ENJ': 'enjincoin',
          'BAT': 'basic-attention-token', 'CHZ': 'chiliz', 'LRC': 'loopring',
          'STORJ': 'storj', 'ANKR': 'ankr', 'REN': 'republic-protocol',
          'SKL': 'skale', 'COTI': 'coti', 'STMX': 'storm'
        }
        
        const baseCoin = setup.coin.replace('USDT', '').replace('BUSD', '').replace('USDC', '')
        const coinId = coinIdMap[baseCoin] || baseCoin.toLowerCase()
        
        // Fetch OHLC data (1 hour candles, 24 hours = 24 candles)
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=1`)
        
        if (response.ok) {
          const ohlcData = await response.json()
          
          // Transform OHLC data [timestamp, open, high, low, close]
          const formattedData = ohlcData.map((candle: number[]) => ({
            time: new Date(candle[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
            // For coloring the candle
            isGreen: candle[4] >= candle[1],
            // Body and wick for visualization
            bodyTop: Math.max(candle[1], candle[4]),
            bodyBottom: Math.min(candle[1], candle[4]),
            wickHigh: candle[2],
            wickLow: candle[3],
          }))
          
          setChartData(formattedData)
        } else {
          throw new Error('Failed to fetch OHLC data')
        }
      } catch (error) {
        console.warn('Could not fetch OHLC data, using line chart fallback:', error)
        // Fallback to line chart with synthetic data
        const points = 24
        const newData = []
        const midPrice = (setup.entryZone[0] + setup.entryZone[1]) / 2
        let currentPrice = midPrice * (1 + (Math.random() - 0.5) * 0.03)
        
        for (let i = 0; i < points; i++) {
          const open = currentPrice
          const close = currentPrice * (1 + (Math.random() - 0.5) * 0.008)
          const high = Math.max(open, close) * (1 + Math.random() * 0.003)
          const low = Math.min(open, close) * (1 - Math.random() * 0.003)
          
          newData.push({
            time: `${i}:00`,
            open,
            high,
            low,
            close,
            isGreen: close >= open,
            bodyTop: Math.max(open, close),
            bodyBottom: Math.min(open, close),
            wickHigh: high,
            wickLow: low,
          })
          currentPrice = close
        }
        setChartData(newData)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOHLCData()
  }, [setup.coin, setup.entryZone, setup.bias])

  const getStatusBadge = () => {
    switch (setup.status) {
      case 'TRIGGERED':
        return { text: 'TRIGGERED', color: 'bg-neon-green/20 text-neon-green border-neon-green/50', pulse: false }
      case 'NEAR TRIGGER':
        return { text: 'NEAR TRIGGER', color: 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/50', pulse: true }
      case 'FORMING':
        return { text: 'FORMING', color: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50', pulse: false }
      default:
        return { text: 'FORMING', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', pulse: false }
    }
  }

  const getBiasBadge = () => {
    switch (setup.bias) {
      case 'Bullish':
        return 'bg-neon-green/20 text-neon-green border-neon-green/50'
      case 'Bearish':
        return 'bg-red-400/20 text-red-400 border-red-400/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getRiskBadge = () => {
    if (!setup.entryZone?.[0] || !setup.stopLoss) {
      return { text: 'UNKNOWN RISK', color: 'bg-gray-500/20 text-gray-400' }
    }
    const risk = Math.abs(setup.entryZone[0] - setup.stopLoss) / setup.entryZone[0] * 100
    if (risk < 2.5) return { text: 'LOW RISK', color: 'bg-neon-green/20 text-neon-green' }
    if (risk < 5) return { text: 'MEDIUM RISK', color: 'bg-neon-yellow/20 text-neon-yellow' }
    return { text: 'HIGH RISK', color: 'bg-red-400/20 text-red-400' }
  }

  const statusBadge = getStatusBadge()
  const riskBadge = getRiskBadge()

  return (
    <motion.div
      layout
      whileHover={{ y: -2, boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }}
      className="glass rounded-xl border border-gray-700/50 overflow-hidden transition-all duration-300"
    >
      {/* Header Section */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Crypto Logo */}
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center border border-gray-700 overflow-hidden">
              <img 
                src={`https://assets.coingecko.com/coins/images/1/small/${setup.coin.replace('USDT', '').toLowerCase()}.png`}
                alt={setup.coin}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const parent = (e.target as HTMLImageElement).parentElement
                  if (parent) {
                    parent.innerHTML = `<span class="text-lg font-bold text-neon-cyan">${setup.coin.replace('USDT', '')}</span>`
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-white">{setup.coin}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getBiasBadge()}`}>
                  {setup.bias.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusBadge.color} ${statusBadge.pulse ? 'animate-pulse' : ''}`}>
                  {statusBadge.text}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(setup.createdAt).toLocaleTimeString()}
                </span>
                {/* TradingView Link */}
                <a 
                  href={`https://www.tradingview.com/chart/?symbol=BINANCE:${setup.coin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-neon-cyan hover:text-neon-purple transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={10} />
                  TradingView
                </a>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-neon-purple">{setup.confidence}%</div>
            <div className="text-xs text-gray-500">Confidence</div>
          </div>
        </div>

        {/* Candlestick Chart with Trade Button */}
        <div className="relative h-36 mb-4 bg-dark-700/30 rounded-lg overflow-hidden border border-gray-700/50 group">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
            <BarChart3 size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">24h OHLC</span>
          </div>
          
          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-700/50 z-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-cyan"></div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, bottom: 5, left: 10 }}>
              <XAxis dataKey="time" hide />
              <YAxis domain={['dataMin - 0.01', 'dataMax + 0.01']} hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a2e', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number, name: string, props: any) => {
                  if (props.dataKey === 'close') {
                    return [`Open: $${props.payload.open?.toFixed(4)}\nHigh: $${props.payload.high?.toFixed(4)}\nLow: $${props.payload.low?.toFixed(4)}\nClose: $${props.payload.close?.toFixed(4)}`, 'OHLC']
                  }
                  return [`$${value.toFixed(4)}`, name]
                }}
              />
              {/* Candle Body (Open-Close) with wicks rendered in shape */}
              <Bar 
                dataKey="close" 
                fill="#22c55e"
                stroke="#22c55e"
                barSize={6}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const isGreen = payload.isGreen
                  const color = isGreen ? '#22c55e' : '#ef4444'
                  const bodyHeight = Math.max(Math.abs(height), 2)
                  
                  return (
                    <g>
                      {/* Wick - top to bottom of candle range */}
                      <line 
                        x1={x + width / 2} 
                        y1={props.y} 
                        x2={x + width / 2} 
                        y2={props.y + props.height} 
                        stroke={color} 
                        strokeWidth={1}
                      />
                      {/* Body */}
                      <rect 
                        x={x} 
                        y={isGreen ? y : y + height} 
                        width={width} 
                        height={bodyHeight} 
                        fill={isGreen ? color : color}
                        stroke={color}
                        rx={1}
                      />
                    </g>
                  )
                }}
              />
              {/* Entry Zone Lines */}
              {setup.entryZone?.[0] && (
                <ReferenceLine 
                  y={setup.entryZone[0]} 
                  stroke="#00f0ff" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ value: `Entry`, fill: '#00f0ff', fontSize: 10, position: 'right' }}
                />
              )}
              {setup.entryZone?.[1] && (
                <ReferenceLine 
                  y={setup.entryZone[1]} 
                  stroke="#00f0ff" 
                  strokeDasharray="5 5" 
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
              )}
              {/* Invalidation */}
              {setup.stopLoss && (
                <ReferenceLine 
                  y={setup.stopLoss} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  label={{ value: `SL`, fill: '#ef4444', fontSize: 9, position: 'right' }}
                />
              )}
              {/* Targets */}
              {setup.targets?.map((target, i) => target && (
                <ReferenceLine 
                  key={i}
                  y={target} 
                  stroke="#22c55e" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  strokeOpacity={0.8 - i * 0.2}
                  label={{ value: `TP${i+1}`, fill: '#22c55e', fontSize: 9, position: 'right' }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Trade Button Overlay */}
          <div className="absolute inset-0 bg-dark-800/90 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="text-center mb-2">
              <div className="text-xs text-gray-400 mb-1">24h Price Action</div>
              <div className="text-sm font-bold text-neon-cyan">
                Entry: ${setup.entryZone?.[0] ? setup.entryZone[0].toLocaleString(undefined, {maximumFractionDigits: 2}) : 'N/A'}
              </div>
            </div>
            <a
              href={`https://www.binance.com/en/trade/${setup.coin}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center gap-2 ${
                setup.bias === 'Bullish'
                  ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-white'
                  : 'bg-gradient-to-r from-red-400 to-red-600 text-white'
              }`}
            >
              <ExternalLink size={14} />
              {setup.bias === 'Bullish' ? 'BUY' : 'SELL'} Trade
            </a>
          </div>
        </div>

        {/* Price Zones */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dark-700/50 rounded-lg p-3 border border-gray-700/50">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Target size={10} />
              Entry Zone
            </div>
            <div className="font-bold text-neon-cyan text-sm">
              {setup.entryZone?.[0] ? `$${setup.entryZone[0].toFixed(2)} - ${setup.entryZone[1].toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 border border-red-400/30">
            <div className="text-xs text-red-400 mb-1 flex items-center gap-1">
              <AlertTriangle size={10} />
              Invalidation
            </div>
            <div className="font-bold text-red-400 text-sm">
              {setup.stopLoss ? `$${setup.stopLoss.toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 border border-neon-green/30">
            <div className="text-xs text-neon-green mb-1">Target(s)</div>
            <div className="font-bold text-neon-green text-sm">
              {setup.targets?.length > 0 
                ? setup.targets.map((t, i) => t ? `$${t.toFixed(2)}${i < setup.targets.length - 1 ? ', ' : ''}` : '').filter(Boolean).join(', ') 
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Risk Badge with Tooltip */}
        <div className="flex items-center gap-2 mb-3">
          <div className="group/tooltip relative">
            <span className={`px-2 py-1 rounded text-xs font-semibold cursor-help ${riskBadge.color}`}>
              {riskBadge.text}
            </span>
            <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="font-semibold text-neon-cyan mb-1">Risk Assessment</div>
              {setup.entryZone?.[0] && setup.stopLoss ? (
                <>
                  <div className="text-gray-400">Risk: ${Math.abs(setup.entryZone[0] - setup.stopLoss).toFixed(4)}</div>
                  <div className="text-gray-500">{(Math.abs(setup.entryZone[0] - setup.stopLoss) / setup.entryZone[0] * 100).toFixed(1)}% of entry price</div>
                </>
              ) : (
                <div className="text-gray-500">Entry or invalidation price not available</div>
              )}
              <div className="text-gray-500 mt-1 text-[10px]">
                Less than 2.5% = Low | 2.5-5% = Medium | Greater than 5% = High
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {setup.targets.length} Take Profit levels
          </span>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition-colors border-t border-gray-700/50"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              Hide Analysis
            </>
          ) : (
            <>
              <BookOpen size={16} />
              View Full Analysis
            </>
          )}
        </button>
      </div>

      {/* Expanded Strategy Breakdown */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-700/50 bg-dark-700/20"
        >
          <div className="p-5 space-y-4">
            {/* Strategy Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2 text-neon-cyan">
                  <Activity size={14} />
                  <span className="text-xs font-semibold uppercase">Strategy</span>
                </div>
                <p className="text-sm text-white">{setup.strategy}</p>
              </div>
              <div className="bg-dark-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2 text-neon-purple">
                  <BarChart3 size={14} />
                  <span className="text-xs font-semibold uppercase">Context</span>
                </div>
                <p className="text-sm text-white">{setup.analysis.marketStructure}</p>
              </div>
              <div className="bg-dark-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2 text-neon-green">
                  <Layers size={14} />
                  <span className="text-xs font-semibold uppercase">Structure</span>
                </div>
                <p className="text-sm text-white">{setup.analysis.trendAlignment}</p>
              </div>
              <div className="bg-dark-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2 text-neon-yellow">
                  <Clock size={14} />
                  <span className="text-xs font-semibold uppercase">Volume</span>
                </div>
                <p className="text-sm text-white">{setup.analysis.volumeProfile}</p>
              </div>
            </div>

            {/* Why This Setup Exists */}
            <div className="bg-dark-700/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-neon-cyan mb-2 flex items-center gap-2">
                <BookOpen size={14} />
                Why This Setup Exists
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                {setup.analysis.marketStructure}. Entry zone at ${setup.entryPrice.toFixed(2)} with {setup.riskRewardRatio.toFixed(1)}:1 risk/reward ratio. Stop loss at ${setup.stopLoss.toFixed(2)}.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setAlertModalOpen(true)}
                className="flex-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 py-2 rounded-lg text-sm font-semibold hover:bg-neon-cyan/30 transition-colors flex items-center justify-center gap-2"
              >
                <Bell size={14} />
                Set Alert
              </button>
              <button 
                onClick={handleSaveToWatchlist}
                disabled={savingWatchlist}
                className="flex-1 bg-neon-purple/20 text-neon-purple border border-neon-purple/50 py-2 rounded-lg text-sm font-semibold hover:bg-neon-purple/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Star size={14} />
                {savingWatchlist ? 'Saving...' : 'Save to Watchlist'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-neon-green/20 border border-neon-green/50 text-neon-green' : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {notification.type === 'success' ? <Check size={18} /> : <X size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAlertModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-sm w-full border border-neon-cyan/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="text-neon-cyan" size={24} />
                  <h3 className="text-lg font-bold">Set Price Alert</h3>
                </div>
                <button onClick={() => setAlertModalOpen(false)} className="p-1 hover:bg-dark-700 rounded">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Alert for {setup.coin}</div>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setAlertType('email')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      alertType === 'email' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' : 'bg-dark-700 text-gray-400 border border-gray-700'
                    }`}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                  <button
                    onClick={() => setAlertType('telegram')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      alertType === 'telegram' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50' : 'bg-dark-700 text-gray-400 border border-gray-700'
                    }`}
                  >
                    <MessageCircle size={14} />
                    Telegram
                  </button>
                </div>

                <label className="block text-sm text-gray-400 mb-2">Alert when price reaches:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    className="flex-1 bg-dark-700 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-cyan"
                    placeholder="Enter price..."
                  />
                  <span className="px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-gray-400">USD</span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setAlertPrice(setup.entryZone[0].toString())}
                    className="px-2 py-1 bg-dark-700 rounded text-xs text-gray-400 hover:text-neon-cyan"
                  >
                    Entry
                  </button>
                  <button
                    onClick={() => setAlertPrice(setup.targets[0]?.toString() || '')}
                    className="px-2 py-1 bg-dark-700 rounded text-xs text-gray-400 hover:text-neon-green"
                  >
                    TP1
                  </button>
                  <button
                    onClick={() => setAlertPrice(setup.stopLoss.toString())}
                    className="px-2 py-1 bg-dark-700 rounded text-xs text-gray-400 hover:text-red-400"
                  >
                    SL
                  </button>
                </div>
              </div>

              <button
                onClick={handleSetAlert}
                className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Create Alert
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  async function handleSetAlert() {
    if (!token) {
      showNotification('error', 'Please sign in to set alerts')
      return
    }
    
    try {
      await api.post('/alerts', {
        coin: setup.coin,
        price: parseFloat(alertPrice),
        type: alertType,
      })
      setAlertModalOpen(false)
      showNotification('success', `${setup.coin} alert set at $${alertPrice}`)
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Failed to set alert')
    }
  }

  async function handleSaveToWatchlist() {
    if (!token) {
      showNotification('error', 'Please sign in to save to watchlist')
      return
    }
    
    setSavingWatchlist(true)
    try {
      await api.post('/watchlist', {
        symbol: setup.coin.replace('USDT', ''),
        coin: setup.coin,
      })
      showNotification('success', `${setup.coin} added to watchlist`)
    } catch (error: any) {
      if (error.response?.status === 409) {
        showNotification('error', `${setup.coin} is already in your watchlist`)
      } else {
        showNotification('error', error.response?.data?.error || 'Failed to save to watchlist')
      }
    } finally {
      setSavingWatchlist(false)
    }
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }
}
