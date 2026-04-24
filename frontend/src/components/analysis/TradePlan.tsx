import { Target, AlertTriangle, TrendingUp, Shield, Percent, Scale } from 'lucide-react'

interface Setup {
  entryZone: { low: number; high: number }
  stopLoss: number
  targets: number[]
  riskRewardRatio: number
  riskPercent: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  bias: 'Bullish' | 'Bearish'
}

interface TradePlanProps {
  setup: Setup
}

export default function TradePlan({ setup }: TradePlanProps) {
  const formatPrice = (price: number) => {
    if (!price || price <= 0) return '0'
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
    return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }

  // Defensive check for invalid setup data
  if (!setup || !setup.entryZone || 
      typeof setup.entryZone.low !== 'number' || 
      typeof setup.entryZone.high !== 'number' ||
      setup.entryZone.low <= 0 || 
      setup.entryZone.high <= 0 ||
      setup.stopLoss <= 0) {
    return (
      <div className="p-4 text-gray-400 text-center">
        <p>Invalid setup data</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Entry Zone */}
      <div className="glass rounded-xl p-3 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
            <Target size={14} className="text-neon-cyan" />
          </div>
          <span className="text-sm text-gray-400">Entry Zone</span>
        </div>
        <div className="text-xl font-bold text-neon-cyan">
          {formatPrice(setup.entryZone.low)} - {formatPrice(setup.entryZone.high)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Optimal entry range
        </div>
      </div>

      {/* Stop Loss */}
      <div className="glass rounded-xl p-3 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-red-400/20 flex items-center justify-center">
            <AlertTriangle size={14} className="text-red-400" />
          </div>
          <span className="text-sm text-gray-400">Stop Loss</span>
        </div>
        <div className="text-xl font-bold text-red-400">
          {formatPrice(setup.stopLoss)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Invalidation level - exit here
        </div>
      </div>

      {/* Targets */}
      <div className="glass rounded-xl p-3 border border-gray-700/50 col-span-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-neon-green/20 flex items-center justify-center">
            <TrendingUp size={14} className="text-neon-green" />
          </div>
          <span className="text-sm text-gray-400">Profit Targets</span>
        </div>
        <div className="flex gap-2">
          {setup.targets.map((target, index) => (
            <div key={index} className="flex-1 bg-dark-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-500 mb-1">TP{index + 1}</div>
              <div className="text-base font-bold text-neon-green">
                {formatPrice(target)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk / Reward */}
      <div className="glass rounded-xl p-3 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-neon-purple/20 flex items-center justify-center">
            <Scale size={14} className="text-neon-purple" />
          </div>
          <span className="text-sm text-gray-400">Risk:Reward</span>
        </div>
        <div className="text-xl font-bold text-neon-purple">
          {setup.riskRewardRatio.toFixed(1)}:1
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Min 2:1 recommended
        </div>
      </div>

      {/* Risk Percent */}
      <div className="glass rounded-xl p-3 border border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-400/20 flex items-center justify-center">
            <Percent size={14} className="text-yellow-400" />
          </div>
          <span className="text-sm text-gray-400">Risk Amount</span>
        </div>
        <div className={`text-xl font-bold ${
          setup.riskPercent < 1.5 ? 'text-neon-green' : 
          setup.riskPercent < 3 ? 'text-neon-cyan' : 'text-red-400'
        }`}>
          {setup.riskPercent.toFixed(1)}%
        </div>
        <div className={`text-xs mt-1 ${
          setup.riskLevel === 'LOW' ? 'text-neon-green' : 
          setup.riskLevel === 'MEDIUM' ? 'text-neon-cyan' : 'text-red-400'
        }`}>
          {setup.riskLevel === 'MEDIUM' ? 'OPTIMAL' : setup.riskLevel} RISK
        </div>
      </div>

      {/* Position Size Guide */}
      <div className="glass rounded-xl p-3 border border-gray-700/50 col-span-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
            <Shield size={14} className="text-neon-cyan" />
          </div>
          <span className="text-sm text-gray-400">Position Size Guide</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-dark-700/50 rounded-lg p-2">
            <div className="text-gray-500 text-xs">Conservative (0.5%)</div>
            <div className="text-neon-cyan font-semibold text-sm">
              ${(500 / setup.riskPercent).toFixed(0)}
            </div>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-2 border border-neon-cyan/30">
            <div className="text-neon-cyan text-xs font-medium">Optimal (1%)</div>
            <div className="text-neon-cyan font-semibold text-sm">
              ${(1000 / setup.riskPercent).toFixed(0)}
            </div>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-2">
            <div className="text-gray-500 text-xs">Aggressive (2%)</div>
            <div className="text-neon-cyan font-semibold text-sm">
              ${(2000 / setup.riskPercent).toFixed(0)}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Based on $100K account. <span className="text-neon-cyan">1% optimal for crypto</span>. Adjust for your account size.
        </div>
      </div>
    </div>
  )
}
