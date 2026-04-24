import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'

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

interface SetupListItemProps {
  setup: Setup
  isSelected: boolean
  onClick: () => void
  index: number
}

export default function SetupListItem({ setup, isSelected, onClick, index }: SetupListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRIGGERED': return 'bg-neon-green/20 text-neon-green border-neon-green/50'
      case 'NEAR TRIGGER': return 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/50'
      case 'FORMING': return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getBiasIcon = (bias: string) => {
    return bias === 'Bullish' 
      ? <TrendingUp size={14} className="text-neon-green" />
      : <TrendingDown size={14} className="text-red-400" />
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
    return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }

  const timeAgo = (date: string) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-neon-cyan/10 border-l-4 border-neon-cyan' 
          : 'hover:bg-dark-700/50 border-l-4 border-transparent'
      }`}
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Crypto Icon */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center border border-gray-700 overflow-hidden">
              <img 
                src={`https://assets.coingecko.com/coins/images/1/small/${setup.coin.replace('USDT', '').toLowerCase()}.png`}
                alt={setup.coin}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{setup.coin}</span>
                <span className="text-xs text-gray-500">{setup.timeframe}</span>
              </div>
              <div className="flex items-center gap-2">
                {getBiasIcon(setup.bias)}
                <span className={`text-xs font-medium ${setup.bias === 'Bullish' ? 'text-neon-green' : 'text-red-400'}`}>
                  {setup.bias}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status & Confidence */}
          <div className="text-right">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(setup.status)}`}>
              {setup.status.replace('_', ' ')}
            </span>
            <div className="mt-1 text-sm font-bold text-neon-purple">
              {setup.confidence}%
            </div>
          </div>
        </div>

        {/* Strategy */}
        <div className="text-xs text-gray-400 mb-3 line-clamp-1">
          {setup.strategy}
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <span className="text-gray-500">Entry</span>
            <div className="text-neon-cyan font-medium">
              {formatPrice(setup.entryZone[0])} - {formatPrice(setup.entryZone[1])}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Stop</span>
            <div className="text-red-400 font-medium">
              {formatPrice(setup.stopLoss)}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Target</span>
            <div className="text-neon-green font-medium">
              {formatPrice(setup.targets[0])}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-500">
              Risk: <span className={setup.riskPercent < 3 ? 'text-neon-green' : setup.riskPercent < 5 ? 'text-neon-yellow' : 'text-red-400'}>{setup.riskPercent.toFixed(1)}%</span>
            </span>
            <span className="text-gray-500">
              R:R <span className="text-neon-cyan">{setup.riskRewardRatio.toFixed(1)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock size={10} />
            {timeAgo(setup.createdAt)}
          </div>
        </div>

        {/* Mini Sparkline */}
        <div className="mt-3 h-8 flex items-end gap-px">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.random() * 100
            const isGreen = Math.random() > 0.4
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm ${isGreen ? 'bg-neon-green/40' : 'bg-red-400/40'}`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
