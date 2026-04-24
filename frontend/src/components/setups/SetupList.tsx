import { motion } from 'framer-motion'
import SetupCard from './SetupCard'
import { Target, Loader2 } from 'lucide-react'

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

interface SetupListProps {
  setups: Setup[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  tier?: string
}

export default function SetupList({ setups, selectedId, onSelect, loading, tier = 'basic' }: SetupListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={32} className="text-neon-cyan" />
        </motion.div>
      </div>
    )
  }

  if (setups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Target size={48} className="mb-4 opacity-50" />
        <p className="text-sm mb-1">Fetching live market data...</p>
        <p className="text-xs opacity-60">Scanning 50+ coins across multiple timeframes</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      {setups.map((setup, index) => (
        <SetupCard
          key={setup.id}
          setup={setup}
          isSelected={selectedId === setup.id}
          onClick={() => onSelect(setup.id)}
          index={index}
          tier={tier}
        />
      ))}
    </div>
  )
}
