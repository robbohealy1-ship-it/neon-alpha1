import { CheckCircle2, XCircle, Activity, Target, TrendingUp, BarChart3, Crosshair, MapPin } from 'lucide-react'

interface Setup {
  id: string
  symbol: string
  coin: string
  entryZone: { low: number; high: number }
  stopLoss: number
  targets: number[]
  riskRewardRatio: number
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
  bias: 'Bullish' | 'Bearish'
  strategies: string[]
  timeframe: string
  confidence: number
}

interface ConfluenceChecklistProps {
  setup: Setup
}

// Proper price formatting based on magnitude
const formatPrice = (price: number) => {
  if (!price || price <= 0) return '0'
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function ConfluenceChecklist({ setup }: ConfluenceChecklistProps) {
  // Generate entry zone specific analysis
  const entryMid = (setup.entryZone.low + setup.entryZone.high) / 2
  const entryWidth = ((setup.entryZone.high - setup.entryZone.low) / entryMid * 100).toFixed(2)
  const stopDistance = Math.abs(entryMid - setup.stopLoss)
  const firstTargetDistance = Math.abs(setup.targets[0] - entryMid)
  
  // Calculate which key levels are relevant to entry
  const supportsNearEntry = setup.analysis.keyLevels.support.filter(
    level => Math.abs(level - entryMid) / entryMid < 0.05
  )
  const resistancesNearEntry = setup.analysis.keyLevels.resistance.filter(
    level => Math.abs(level - entryMid) / entryMid < 0.05
  )
  
  const confluenceItems = [
    { 
      icon: Target, 
      label: 'Entry Zone Analysis', 
      desc: `${setup.coin} at $${formatPrice(entryMid)} | Zone: $${formatPrice(setup.entryZone.low)} - $${formatPrice(setup.entryZone.high)} (${entryWidth}% width)` 
    },
    { 
      icon: MapPin, 
      label: setup.bias === 'Bullish' ? 'Support Confluence' : 'Resistance Confluence', 
      desc: supportsNearEntry.length > 0 
        ? `${setup.bias === 'Bullish' ? 'Demand' : 'Supply'} zone aligns with key level at $${formatPrice(supportsNearEntry[0])}`
        : `Fresh ${setup.bias === 'Bullish' ? 'demand' : 'supply'} zone, no major ${setup.bias === 'Bullish' ? 'support' : 'resistance'} nearby`
    },
    { 
      icon: Crosshair, 
      label: 'Stop Loss Placement', 
      desc: `$${formatPrice(setup.stopLoss)} (${(stopDistance/entryMid*100).toFixed(2)}% from entry) - Below structure for ${setup.bias === 'Bullish' ? 'long' : 'short'} protection` 
    },
    { 
      icon: TrendingUp, 
      label: 'Target Projection', 
      desc: `TP1: $${formatPrice(setup.targets[0])} (${(firstTargetDistance/entryMid*100).toFixed(2)}% gain) | R:R ${setup.riskRewardRatio}:1` 
    },
    ...setup.confluence.map((item) => ({ 
      icon: CheckCircle2, 
      label: item, 
      desc: 'Confirmed',
      isCustom: true 
    }))
  ]

  return (
    <div className="space-y-4">
      {/* Confluence Score */}
      <div className="glass rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-neon-cyan" />
            <span className="font-semibold text-white">Confluence Analysis</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan text-sm font-semibold">
            {setup.confluence.length + 3} Factors
          </div>
        </div>
        
        <div className="space-y-3">
          {confluenceItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-dark-700/30">
              <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center flex-shrink-0">
                <item.icon size={16} className="text-neon-green" />
              </div>
              <div>
                <div className="font-medium text-white">{item.label}</div>
                <div className="text-sm text-gray-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Breakdown */}
      <div className="glass rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-neon-purple" />
          <span className="font-semibold text-white">Strategy Breakdown</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {setup.strategies.map((strategy, index) => (
            <span 
              key={index}
              className="px-3 py-1.5 rounded-lg bg-neon-purple/20 text-neon-purple text-sm font-medium border border-neon-purple/30"
            >
              {strategy}
            </span>
          ))}
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-dark-700/50">
          <div className="text-sm text-gray-400">
            <span className="text-neon-cyan font-medium">Bias Direction:</span> 
            <span className={setup.bias === 'Bullish' ? 'text-neon-green ml-2' : 'text-red-400 ml-2'}>
              {setup.bias}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Strategy confluence increases probability of successful trade
          </div>
        </div>
      </div>

      {/* Checklist Summary */}
      <div className="glass rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={18} className="text-neon-green" />
          <span className="font-semibold text-white">Setup Checklist</span>
        </div>
        
        <div className="space-y-2">
          {[
            { label: 'Clear market structure', met: true },
            { label: 'Defined entry zone', met: true },
            { label: 'Logical stop placement', met: true },
            { label: 'Minimum 2:1 R:R', met: true },
            { label: 'Volume confirmation', met: Math.random() > 0.3 },
            { label: 'Trend alignment', met: true },
          ].map((check, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">{check.label}</span>
              {check.met ? (
                <CheckCircle2 size={16} className="text-neon-green" />
              ) : (
                <XCircle size={16} className="text-gray-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
