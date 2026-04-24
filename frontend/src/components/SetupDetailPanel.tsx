import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, X, Target, AlertTriangle, 
  CheckCircle2, BarChart3, ExternalLink,
  Shield, Layers, Activity
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

interface SetupDetailPanelProps {
  setup: Setup | null
  onClose: () => void
}

export default function SetupDetailPanel({ setup, onClose }: SetupDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'trade' | 'analysis' | 'context'>('trade')

  if (!setup) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a setup to view detailed analysis</p>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
    return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRIGGERED': return 'text-neon-green'
      case 'NEAR TRIGGER': return 'text-neon-yellow'
      case 'FORMING': return 'text-neon-cyan'
      default: return 'text-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-dark-800/50"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center border border-gray-700">
              <img 
                src={`https://assets.coingecko.com/coins/images/1/small/${setup.coin.replace('USDT', '').toLowerCase()}.png`}
                alt={setup.coin}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{setup.coin}</h2>
                <span className="text-sm text-gray-400">{setup.timeframe}</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${setup.bias === 'Bullish' ? 'text-neon-green' : 'text-red-400'}`}>
                  {setup.bias === 'Bullish' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {setup.bias}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-semibold ${getStatusColor(setup.status)}`}>
                  {setup.status.replace('_', ' ')}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-neon-purple font-semibold">{setup.confidence}% Confidence</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Strategy Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {setup.strategies.map((strat, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-dark-700 text-xs text-gray-300 border border-gray-600">
              {strat}
            </span>
          ))}
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="h-80 bg-dark-900 border-b border-gray-700/50">
        <iframe
          src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${setup.coin}&interval=${setup.timeframe === '1H' ? '60' : setup.timeframe === '4H' ? '240' : 'D'}&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1&hide_side_toolbar=1&allow_symbol_change=0&save_image=1&calendar=1`}
          className="w-full h-full"
          allowFullScreen
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50">
        {[
          { id: 'trade', label: 'Trade Plan', icon: Target },
          { id: 'analysis', label: 'Analysis', icon: Activity },
          { id: 'context', label: 'Market Context', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'trade' && (
          <div className="space-y-6">
            {/* Trade Plan Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-neon-cyan" />
                  <span className="text-sm text-gray-400">Entry Zone</span>
                </div>
                <div className="text-lg font-bold text-neon-cyan">
                  {formatPrice(setup.entryZone[0])} - {formatPrice(setup.entryZone[1])}
                </div>
              </div>
              
              <div className="glass rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-sm text-gray-400">Stop Loss</span>
                </div>
                <div className="text-lg font-bold text-red-400">
                  {formatPrice(setup.stopLoss)}
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-neon-green" />
                  <span className="text-sm text-gray-400">Targets</span>
                </div>
                <div className="space-y-1">
                  {setup.targets.map((target, i) => (
                    <div key={i} className="text-sm font-medium text-neon-green">
                      TP{i + 1}: {formatPrice(target)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-neon-purple" />
                  <span className="text-sm text-gray-400">Risk / Reward</span>
                </div>
                <div className="text-lg font-bold text-neon-purple">
                  {setup.riskPercent.toFixed(1)}% / {setup.riskRewardRatio.toFixed(1)}:1
                </div>
                <div className={`text-xs mt-1 ${setup.riskLevel === 'LOW' ? 'text-neon-green' : setup.riskLevel === 'MEDIUM' ? 'text-neon-yellow' : 'text-red-400'}`}>
                  {setup.riskLevel} RISK
                </div>
              </div>
            </div>

            {/* Confluence Factors */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-neon-cyan" />
                Confluence Factors
              </h3>
              <div className="space-y-2">
                {setup.confluence.map((factor, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30">
                    <CheckCircle2 size={16} className="text-neon-green flex-shrink-0" />
                    <span className="text-sm text-gray-300">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Layers size={16} className="text-neon-cyan" />
                Market Structure
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {setup.analysis.marketStructure}
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Activity size={16} className="text-neon-cyan" />
                Volume Profile
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {setup.analysis.volumeProfile}
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-neon-cyan" />
                Trend Alignment
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {setup.analysis.trendAlignment}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'context' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Key Support Levels</h3>
              <div className="flex flex-wrap gap-2">
                {setup.analysis.keyLevels.support.map((level, i) => (
                  <span key={i} className="px-3 py-1 rounded bg-neon-green/10 text-neon-green text-sm">
                    {formatPrice(level)}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Key Resistance Levels</h3>
              <div className="flex flex-wrap gap-2">
                {setup.analysis.keyLevels.resistance.map((level, i) => (
                  <span key={i} className="px-3 py-1 rounded bg-red-400/10 text-red-400 text-sm">
                    {formatPrice(level)}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Setup Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-300">{new Date(setup.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span className="text-gray-300">{new Date(setup.expiresAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timeframe</span>
                  <span className="text-gray-300">{setup.timeframe}</span>
                </div>
              </div>
            </div>

            <a
              href={`https://www.tradingview.com/chart/?symbol=BINANCE:${setup.coin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
            >
              <ExternalLink size={18} />
              Open in TradingView
            </a>
          </div>
        )}
      </div>
    </motion.div>
  )
}
