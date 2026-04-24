import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, 
  ChevronDown, ChevronUp, Bell, Eye, Zap, Shield, 
  BarChart3, Layers, Crosshair, Percent, Award, Activity,
  ArrowUpRight, ArrowDownRight, Info, CheckCircle2
} from 'lucide-react'

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
}

export default function SetupCard({ setup }: SetupCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [alertSet, setAlertSet] = useState(false)
  const [watchlisted, setWatchlisted] = useState(false)

  const isBullish = setup.bias === 'Bullish'
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FORMING': return 'text-neon-cyan border-neon-cyan bg-neon-cyan/10'
      case 'NEAR TRIGGER': return 'text-neon-yellow border-neon-yellow bg-neon-yellow/10'
      case 'TRIGGERED': return 'text-neon-green border-neon-green bg-neon-green/10'
      case 'EXPIRED': return 'text-gray-500 border-gray-500 bg-gray-500/10'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-neon-green border-neon-green bg-neon-green/10'
      case 'MEDIUM': return 'text-neon-yellow border-neon-yellow bg-neon-yellow/10'
      case 'HIGH': return 'text-red-400 border-red-400 bg-red-400/10'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-neon-green'
    if (score >= 65) return 'text-neon-yellow'
    return 'text-neon-cyan'
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 })
    if (price >= 100) return price.toLocaleString(undefined, { maximumFractionDigits: 1 })
    if (price >= 1) return price.toLocaleString(undefined, { maximumFractionDigits: 2 })
    return price.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  // Mini sparkline chart for visual effect
  const generateSparkline = () => {
    const points = 20
    const data = []
    let value = 50
    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.5) * 15
      value = Math.max(20, Math.min(80, value))
      data.push(value)
    }
    
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    
    return data.map((v, i) => ({
      x: (i / (points - 1)) * 100,
      y: 100 - ((v - min) / range) * 100
    }))
  }

  const sparklineData = generateSparkline()
  const sparklinePath = sparklineData.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  return (
    <motion.div
      layout
      className="glass rounded-2xl overflow-hidden border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Asset Info */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isBullish 
                ? 'bg-gradient-to-br from-neon-green/20 to-emerald-500/20' 
                : 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
            }`}>
              {isBullish ? (
                <TrendingUp className="text-neon-green" size={24} />
              ) : (
                <TrendingDown className="text-red-400" size={24} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{setup.symbol}</span>
                <span className="text-xs text-gray-500">{setup.timeframe}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-sm font-medium ${isBullish ? 'text-neon-green' : 'text-red-400'}`}>
                  {setup.bias}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-xs text-gray-400">{formatDate(setup.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(setup.status)}`}>
                {setup.status}
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getRiskColor(setup.riskLevel)}`}>
                {setup.riskLevel} RISK
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={14} className={getConfidenceColor(setup.confidence)} />
              <span className={`text-sm font-bold ${getConfidenceColor(setup.confidence)}`}>
                {setup.confidence}%
              </span>
              <span className="text-xs text-gray-500">confidence</span>
            </div>
          </div>
        </div>

        {/* Strategy Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(setup.strategies || [setup.strategy]).slice(0, 3).map((strategy, idx) => (
            <span 
              key={idx}
              className="px-2 py-1 rounded-md bg-dark-700/50 text-xs text-gray-300 border border-gray-700"
            >
              <Zap size={10} className="inline mr-1 text-neon-cyan" />
              {strategy}
            </span>
          ))}
        </div>

        {/* Mini Chart */}
        <div className="mt-4 h-20 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${setup.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isBullish ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isBullish ? '#22c55e' : '#ef4444'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${sparklinePath} L 100 100 L 0 100 Z`}
              fill={`url(#gradient-${setup.id})`}
            />
            <path
              d={sparklinePath}
              fill="none"
              stroke={isBullish ? '#22c55e' : '#ef4444'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Entry Zone Indicator */}
            <line 
              x1="30" y1="0" x2="30" y2="100" 
              stroke="#06b6d4" 
              strokeWidth="1" 
              strokeDasharray="4 2"
              opacity="0.5"
            />
            {/* Current Price Indicator */}
            <circle cx="60" cy={sparklineData[12]?.y || 50} r="3" fill="#fff" />
          </svg>
          <div className="absolute top-1 left-2 text-xs text-neon-cyan">
            Entry Zone
          </div>
          <div className="absolute top-1 right-2 text-xs text-gray-400">
            {isBullish ? <ArrowUpRight size={12} className="inline" /> : <ArrowDownRight size={12} className="inline" />}
            Live
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-dark-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Entry</div>
            <div className="text-sm font-semibold text-white">
              ${formatPrice(setup.entryZone[0])} - ${formatPrice(setup.entryZone[1])}
            </div>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Stop Loss</div>
            <div className="text-sm font-semibold text-red-400">
              ${formatPrice(setup.stopLoss)}
            </div>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">R:R Ratio</div>
            <div className="text-sm font-semibold text-neon-cyan">
              1:{setup.riskRewardRatio.toFixed(1)}
            </div>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">TP1 Target</div>
            <div className="text-sm font-semibold text-neon-green">
              ${formatPrice(setup.targets[0])}
            </div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Setup Confidence</span>
            <span className={`text-xs font-semibold ${getConfidenceColor(setup.confidence)}`}>
              {setup.confidence}%
            </span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${setup.confidence}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                setup.confidence >= 80 ? 'bg-gradient-to-r from-neon-green to-emerald-400' :
                setup.confidence >= 65 ? 'bg-gradient-to-r from-neon-yellow to-amber-400' :
                'bg-gradient-to-r from-neon-cyan to-blue-400'
              }`}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Weak</span>
            <span>Strong</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 rounded-lg text-sm text-gray-300 hover:bg-dark-600 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Hide Analysis' : 'Full Analysis'}
          </button>
          <button
            onClick={() => setAlertSet(!alertSet)}
            className={`p-2 rounded-lg transition-colors ${
              alertSet 
                ? 'bg-neon-cyan/20 text-neon-cyan' 
                : 'bg-dark-700 text-gray-400 hover:text-neon-cyan'
            }`}
            title="Set Alert"
          >
            <Bell size={18} />
          </button>
          <button
            onClick={() => setWatchlisted(!watchlisted)}
            className={`p-2 rounded-lg transition-colors ${
              watchlisted 
                ? 'bg-neon-purple/20 text-neon-purple' 
                : 'bg-dark-700 text-gray-400 hover:text-neon-purple'
            }`}
            title="Add to Watchlist"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Analysis */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-700/50"
          >
            <div className="p-5 space-y-5">
              {/* Market Structure */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-neon-cyan" />
                  Market Structure
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {setup.analysis.marketStructure}
                </p>
              </div>

              {/* Key Levels */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Crosshair size={16} className="text-neon-cyan" />
                  Key Levels
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-700/50 rounded-lg p-3">
                    <div className="text-xs text-neon-green mb-2 flex items-center gap-1">
                      <Shield size={12} />
                      Support
                    </div>
                    <div className="space-y-1">
                      {setup.analysis.keyLevels.support.map((level, idx) => (
                        <div key={idx} className="text-sm text-gray-300">
                          S{idx + 1}: ${formatPrice(level)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-3">
                    <div className="text-xs text-red-400 mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Resistance
                    </div>
                    <div className="space-y-1">
                      {setup.analysis.keyLevels.resistance.map((level, idx) => (
                        <div key={idx} className="text-sm text-gray-300">
                          R{idx + 1}: ${formatPrice(level)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confluence Factors */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Layers size={16} className="text-neon-cyan" />
                  Confluence Factors
                  <span className="text-xs text-gray-500 font-normal">
                    ({setup.confluence.length} confirmations)
                  </span>
                </h4>
                <ul className="space-y-2">
                  {setup.confluence.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 size={14} className="text-neon-cyan mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Volume & Trend */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Activity size={12} />
                    Volume Profile
                  </div>
                  <p className="text-sm text-gray-300">{setup.analysis.volumeProfile}</p>
                </div>
                <div className="bg-dark-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <TrendingUp size={12} />
                    Trend Alignment
                  </div>
                  <p className="text-sm text-gray-300">{setup.analysis.trendAlignment}</p>
                </div>
              </div>

              {/* All Targets */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target size={16} className="text-neon-cyan" />
                  Target Levels
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {setup.targets.map((target, idx) => (
                    <div key={idx} className="bg-dark-700/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500 mb-1">TP{idx + 1}</div>
                      <div className="text-lg font-bold text-neon-green">${formatPrice(target)}</div>
                      <div className="text-xs text-gray-500">
                        +{((target - setup.entryPrice) / setup.entryPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-dark-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Percent size={16} className="text-neon-cyan" />
                  Risk Assessment
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Risk Amount</span>
                    <div className="text-red-400 font-semibold">
                      ${formatPrice(Math.abs(setup.entryPrice - setup.stopLoss))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Risk %</span>
                    <div className={`font-semibold ${
                      setup.riskPercent > 5 ? 'text-red-400' : 
                      setup.riskPercent > 2.5 ? 'text-neon-yellow' : 'text-neon-green'
                    }`}>
                      {setup.riskPercent.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Reward</span>
                    <div className="text-neon-green font-semibold">
                      ${formatPrice(Math.abs(setup.targets[setup.targets.length - 1] - setup.entryPrice))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-dark-700/30 rounded-lg p-3">
                <Info size={14} className="text-neon-cyan mt-0.5 flex-shrink-0" />
                <p>
                  This setup is generated using algorithmic analysis of market structure and price action. 
                  Past performance does not guarantee future results. Always use proper risk management 
                  and never risk more than you can afford to lose. Expires: {new Date(setup.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
