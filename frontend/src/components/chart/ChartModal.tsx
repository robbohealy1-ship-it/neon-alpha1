import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Target, Activity, BarChart3, ExternalLink } from 'lucide-react'
import TradingViewChart from '../TradingViewChart'
import TradePlan from '../analysis/TradePlan'
import ConfluenceChecklist from '../analysis/ConfluenceChecklist'

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
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  timeframe: string
  confluence: string[]
  analysis: {
    marketStructure: string
    volumeProfile: string
    trendAlignment: string
    keyLevels: {
      support: number[]
      resistance: number[]
    }
  }
  createdAt: string
  expiresAt: string
}

interface ChartModalProps {
  setup: Setup | null
  onClose: () => void
  tier?: string
  locked?: boolean
}

export default function ChartModal({ setup, onClose, locked = false }: ChartModalProps) {
  const [activeTab, setActiveTab] = useState<'trade' | 'analysis' | 'context'>('trade')
  const isLocked = locked // Use passed locked prop for blur logic

  // Proper price formatting based on magnitude
  const formatPrice = (price: number) => {
    if (!price || price <= 0) return '0'
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
    return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col bg-dark-800/50"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center border border-gray-700 overflow-hidden">
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
            <h2 className="text-xl font-bold text-white">{setup.coin}</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">{setup.timeframe}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${setup.bias === 'Bullish' ? 'bg-neon-green/20 text-neon-green' : 'bg-red-400/20 text-red-400'}`}>
                {setup.bias}
              </span>
              <span className="text-neon-purple font-semibold">{setup.confidence}% Confidence</span>
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

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Trade Levels Overlay - Blurred for locked setups */}
        <div className="px-4 pt-2 pb-2 border-b border-gray-700/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`flex items-center gap-1.5 ${isLocked ? 'blur-sm select-none' : ''}`}>
                <span className="w-2.5 h-2.5 rounded bg-neon-cyan/30 border border-neon-cyan"></span>
                <span className="text-gray-400 text-xs">Entry:</span>
                <span className="text-neon-cyan font-semibold text-xs">
                  {isLocked ? '••••• - •••••' : `${formatPrice(setup.entryZone.low)} - ${formatPrice(setup.entryZone.high)}`}
                </span>
              </div>
              <div className={`flex items-center gap-1.5 ${isLocked ? 'blur-sm select-none' : ''}`}>
                <span className="w-2.5 h-2.5 rounded bg-red-400/30 border border-red-400"></span>
                <span className="text-gray-400 text-xs">SL:</span>
                <span className="text-red-400 font-semibold text-xs">
                  {isLocked ? '•••••' : formatPrice(setup.stopLoss)}
                </span>
              </div>
              {setup.targets.map((target, i) => (
                <div key={i} className={`flex items-center gap-1.5 ${isLocked ? 'blur-sm select-none' : ''}`}>
                  <span className="w-2.5 h-2.5 rounded bg-neon-green/30 border border-neon-green"></span>
                  <span className="text-gray-400 text-xs">TP{i+1}:</span>
                  <span className="text-neon-green font-semibold text-xs">
                    {isLocked ? '•••••' : formatPrice(target)}
                  </span>
                </div>
              ))}
            </div>
            <a
              href={`https://www.tradingview.com/chart/?symbol=BINANCE:${setup.coin}&interval=60`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan text-xs rounded transition-colors flex items-center gap-1 whitespace-nowrap"
              title="Open full TradingView with all tools"
            >
              <ExternalLink size={12} />
              Full Chart
            </a>
          </div>
          
          {/* Upgrade banner for locked setups */}
          {isLocked && (
            <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 border border-neon-purple/30">
              <p className="text-xs text-center text-gray-300">
                🔒 <span className="text-neon-cyan font-semibold">Upgrade to PRO</span> to unlock precise entry zones, stop loss & take profit levels
              </p>
            </div>
          )}
        </div>

        {/* Chart Section - TradingView Widget */}
        <div className="flex-1 min-h-[250px] px-4 pb-2">
          <TradingViewChart 
            symbol={setup.coin.replace('USDT', '').replace('USD', '')} 
            theme="dark"
            strategy={setup.strategies}
            timeframe={setup.timeframe}
          />
        </div>

        {/* Tabs */}
        <div className="px-4 border-b border-gray-700/50 shrink-0">
          <div className="flex gap-1">
            {[
              { id: 'trade', label: 'Trade Plan', icon: Target },
              { id: 'analysis', label: 'Analysis', icon: Activity },
              { id: 'context', label: 'Context', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'text-neon-cyan border-b-2 border-neon-cyan' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {activeTab === 'trade' && <TradePlan setup={setup} />}
          {activeTab === 'analysis' && <ConfluenceChecklist setup={setup} />}
          {activeTab === 'context' && (
            <div className="space-y-3">
              <div className="glass rounded-lg p-3 border border-gray-700/50">
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Support Levels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {setup.analysis.keyLevels.support.map((level, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-neon-green/10 text-neon-green text-xs font-medium">
                      ${formatPrice(level)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass rounded-lg p-3 border border-gray-700/50">
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Resistance Levels</h3>
                <div className="flex flex-wrap gap-1.5">
                  {setup.analysis.keyLevels.resistance.map((level, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-400/10 text-red-400 text-xs font-medium">
                      ${formatPrice(level)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
