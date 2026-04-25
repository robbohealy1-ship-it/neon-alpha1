import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface Setup {
  id: string
  symbol: string
  coin: string
  bias: 'Bullish' | 'Bearish'
  status: 'FORMING' | 'NEAR TRIGGER' | 'TRIGGERED' | 'EXPIRED'
  strategies: string[]
  entryZone: { low: number; high: number }
  stopLoss: number
  targets: number[]
  riskRewardRatio: number
  riskPercent: number
  confidence: number
  timeframe: string
  createdAt: string
}

interface SetupCardProps {
  setup: Setup
  isSelected: boolean
  onClick: () => void
  index: number
  tier?: string
}

export default function SetupCard({ setup, isSelected, onClick, index, tier = 'basic' }: SetupCardProps) {
  const isBasic = tier === 'basic'
  const isLocked = isBasic && index >= 2 // First 2 setups unlocked for BASIC, rest locked
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRIGGERED': return 'bg-trading-profit/20 text-trading-profit border-trading-profit/50'
      case 'NEAR TRIGGER': return 'bg-trading-gold/20 text-trading-gold border-trading-gold/50'
      case 'FORMING': return 'bg-trading-cyan/20 text-trading-cyan border-trading-cyan/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getBiasIcon = (bias: string) => {
    return bias === 'Bullish' 
      ? <TrendingUp size={14} className="text-trading-profit" />
      : <TrendingDown size={14} className="text-trading-loss" />
  }

  const formatPrice = (price: number) => {
    if (!price || price <= 0) return '-'
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

  // Defensive check for invalid setup data
  if (!setup || !setup.entryZone || typeof setup.entryZone.low !== 'number' || typeof setup.entryZone.high !== 'number') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-dark-700/50 border border-gray-700/50"
      >
        <p className="text-gray-400 text-sm">Invalid setup data</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-trading-cyan/10 border border-trading-cyan/50 shadow-lg shadow-trading-cyan/10' 
          : 'bg-dark-800/50 border border-dark-700/50 hover:bg-dark-800 hover:border-dark-600'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Crypto Icon */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center border border-gray-700 overflow-hidden">
            <img 
              src={`https://assets.coingecko.com/coins/images/1/small/${setup.coin.toLowerCase().replace('usdt', '').replace('usd', '')}.png`}
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
            <div className="flex items-center gap-1">
              {getBiasIcon(setup.bias)}
              <span className={`text-xs font-medium ${setup.bias === 'Bullish' ? 'text-trading-profit' : 'text-trading-loss'}`}>
                {setup.bias}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(setup.status)}`}>
            {setup.status.replace('_', ' ')}
          </span>
          <div className="mt-1 text-sm font-bold text-trading-gold">
            {setup.confidence}%
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div className="text-xs text-gray-400 mb-3 line-clamp-1">
        {setup.strategies.join(' + ')}
      </div>

      {/* Key Levels - Blurred for locked setups (index >= 2 for BASIC) */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <span className="text-gray-500">Entry</span>
          <div className={`text-trading-cyan font-medium ${isLocked ? 'blur-sm select-none' : ''}`}>
            {isLocked ? '••••• - •••••' : `${formatPrice(setup.entryZone.low)} - ${formatPrice(setup.entryZone.high)}`}
          </div>
        </div>
        <div>
          <span className="text-gray-500">SL</span>
          <div className={`text-trading-loss font-medium ${isLocked ? 'blur-sm select-none' : ''}`}>
            {isLocked ? '•••••' : formatPrice(setup.stopLoss)}
          </div>
        </div>
        <div>
          <span className="text-gray-500">TP</span>
          <div className={`text-trading-profit font-medium ${isLocked ? 'blur-sm select-none' : ''}`}>
            {isLocked ? '•••••' : formatPrice(setup.targets[0])}
          </div>
        </div>
      </div>
      
      {/* Upgrade prompt for locked setups */}
      {isLocked && (
        <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-trading-plasma/20 to-trading-cyan/20 border border-trading-plasma/30">
          <p className="text-xs text-center text-gray-300">
            🔒 <span className="text-trading-cyan font-semibold">Upgrade to PRO</span> to unlock entry prices & targets
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-500">
            RR <span className="text-trading-cyan font-semibold">{setup.riskRewardRatio.toFixed(1)}</span>
          </span>
          <span className="text-gray-500">
            Risk <span className={setup.riskPercent < 3 ? 'text-trading-profit' : setup.riskPercent < 5 ? 'text-trading-gold' : 'text-trading-loss'}>{setup.riskPercent.toFixed(1)}%</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <Clock size={10} />
          {timeAgo(setup.createdAt)}
        </div>
      </div>

      {/* Mini Chart Sparkline */}
      <div className="mt-3 h-6 flex items-end gap-px">
        {Array.from({ length: 16 }).map((_, i) => {
          const height = 30 + Math.random() * 70
          const isGreen = Math.random() > 0.4
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm ${isGreen ? 'bg-trading-profit/30' : 'bg-trading-loss/30'}`}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>
    </motion.div>
  )
}
