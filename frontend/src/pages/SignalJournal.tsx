import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Activity,
  BarChart3,
  Trophy,
  XCircle,
  Clock
} from 'lucide-react'
import api from '../lib/api'

interface Signal {
  id: string
  coin: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  status: string
  entry: number
  entryMin: number
  entryMax: number
  stopLoss: number
  takeProfit: number
  exitPrice: number | null
  pnlPercent: number
  riskReward: number
  confidence: number
  timeframe: string
  strategy: string
  createdAt: string
  triggeredAt: string | null
  expiresAt: string
  parentSetupId: string | null
}

interface JournalSummary {
  totalSignals: number
  completedTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  totalProfit: number
  totalLoss: number
  netPnl: number
}

export default function SignalJournal() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [summary, setSummary] = useState<JournalSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'active'>('all')
  const [tier, setTier] = useState('basic')

  useEffect(() => {
    loadJournal()
  }, [])

  const loadJournal = async () => {
    try {
      const { data } = await api.get('/signals/journal')
      setSignals(data.signals || [])
      setSummary(data.summary)
      setTier(data.tier || 'basic')
    } catch (error) {
      console.error('Failed to load signal journal:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSignals = signals.filter(s => {
    if (filter === 'all') return true
    if (filter === 'success') return s.status === 'SUCCESS'
    if (filter === 'failed') return s.status === 'FAILED'
    if (filter === 'active') return ['FORMING', 'ACTIVE', 'TRIGGERED'].includes(s.status)
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <Trophy className="w-4 h-4 text-neon-green" />
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />
      case 'TRIGGERED': return <Target className="w-4 h-4 text-neon-cyan" />
      case 'ACTIVE': return <Activity className="w-4 h-4 text-neon-yellow" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-neon-green/20 text-neon-green border-neon-green/40'
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/40'
      case 'TRIGGERED': return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40'
      case 'ACTIVE': return 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/40'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Signal Journal</h1>
          <p className="text-gray-400 mt-1">Auto-tracked signals from trade setups with complete P&L history</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <BarChart3 className="w-4 h-4" />
          <span>{signals.length} total signals</span>
        </div>
      </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 border-neon-cyan/30"
            >
              <div className="text-xs text-gray-400 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-white">{summary.winRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">{summary.completedTrades} completed</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-4 border-neon-green/30"
            >
              <div className="text-xs text-gray-400 mb-1">Net P&L</div>
              <div className={`text-2xl font-bold ${summary.netPnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {summary.netPnl >= 0 ? '+' : ''}{summary.netPnl.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500">
                +{summary.totalProfit.toFixed(1)}% / -{summary.totalLoss.toFixed(1)}%
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-4"
            >
              <div className="text-xs text-gray-400 mb-1">Avg Win</div>
              <div className="text-2xl font-bold text-neon-green">+{summary.avgWin.toFixed(2)}%</div>
              <div className="text-xs text-gray-500">per winning trade</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-4"
            >
              <div className="text-xs text-gray-400 mb-1">Profit Factor</div>
              <div className="text-2xl font-bold text-white">{summary.profitFactor.toFixed(2)}</div>
              <div className="text-xs text-gray-500">gross profit / loss</div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'active', 'success', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tier Notice */}
        {tier === 'basic' && (
          <div className="glass rounded-lg p-4 border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Starter plan: Limited to 20 signals. Upgrade to PRO for full history.</span>
            </div>
          </div>
        )}

        {/* Signals Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Signal</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Entry / Exit</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">P&L</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">R:R</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.map((signal, index) => (
                  <motion.tr
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-700/30 hover:bg-dark-700/30"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          signal.direction === 'LONG' ? 'bg-neon-green/20' : 'bg-red-500/20'
                        }`}>
                          {signal.direction === 'LONG' ? (
                            <TrendingUp className="w-4 h-4 text-neon-green" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{signal.coin}</div>
                          <div className="text-xs text-gray-500">{signal.timeframe} • {signal.strategy}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-white">{signal.entry.toFixed(4)}</div>
                      {signal.exitPrice && (
                        <div className={`text-xs ${
                          signal.pnlPercent >= 0 ? 'text-neon-green' : 'text-red-400'
                        }`}>
                          → {signal.exitPrice.toFixed(4)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {signal.pnlPercent !== 0 ? (
                        <div className={`font-semibold ${
                          signal.pnlPercent >= 0 ? 'text-neon-green' : 'text-red-400'
                        }`}>
                          {signal.pnlPercent >= 0 ? '+' : ''}{signal.pnlPercent.toFixed(2)}%
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-400">1:{signal.riskReward.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(signal.status)}`}>
                        {getStatusIcon(signal.status)}
                        {signal.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {formatDate(signal.createdAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredSignals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No signals found for this filter.
              </div>
            )}
          </div>
        )}
      </div>
  )
}
