import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, Sparkles, Target, Clock, Activity, Filter, 
  RefreshCw, Shield, AlertTriangle, BarChart3, Zap, Layers
} from 'lucide-react'
import SetupCard from '../components/SetupCard'
import api from '../lib/api'

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

interface Stats {
  total: number
  byStatus: {
    forming: number
    near_trigger: number
    triggered: number
    expired: number
  }
  byBias: {
    bullish: number
    bearish: number
  }
  byRisk: {
    LOW: number
    MEDIUM: number
    HIGH: number
  }
  avgConfidence: number
  avgRiskReward: string
}

function TradeSetupsContent() {
  const [setups, setSetups] = useState<Setup[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [biasFilter, setBiasFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [strategyFilter, setStrategyFilter] = useState<string>('all')

  useEffect(() => {
    loadSetups()
    loadStats()
  }, [])

  const loadSetups = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/setups')
      setSetups(data)
    } catch (error) {
      console.error('Failed to load setups:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await api.get('/setups/stats')
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleRefresh = async () => {
    setGenerating(true)
    try {
      await api.post('/setups/generate')
      await Promise.all([loadSetups(), loadStats()])
    } catch (error) {
      console.error('Failed to refresh setups:', error)
    } finally {
      setGenerating(false)
    }
  }

  // Get unique strategies for filter
  const availableStrategies = Array.from(
    new Set(setups.flatMap(s => s.strategies || []))
  ).sort()

  const filteredSetups = setups.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (biasFilter !== 'all' && s.bias.toLowerCase() !== biasFilter.toLowerCase()) return false
    if (riskFilter !== 'all' && s.riskLevel !== riskFilter) return false
    if (strategyFilter !== 'all' && !(s.strategies || []).includes(strategyFilter)) return false
    return true
  })

  const getStatusCount = (status: string) => {
    const key = status.toLowerCase().replace(' ', '_') as keyof Stats['byStatus']
    return stats?.byStatus[key] || 0
  }
  
  const activeFiltersCount = [statusFilter, biasFilter, riskFilter, strategyFilter].filter(f => f !== 'all').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-neon-cyan animate-pulse">Analyzing market structure...</p>
          <p className="text-xs text-gray-500 mt-2">Scanning for liquidity sweeps, FVGs, and structure shifts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gradient tracking-tight flex items-center gap-3">
            <BarChart3 className="text-neon-cyan" size={36} />
            TRADE SETUPS
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Zap size={16} className="text-neon-purple" />
            Institutional-Grade Trade Analysis
            <span className="text-gray-600">|</span>
            <span className="text-neon-cyan">{stats?.total || setups.length} Active Setups</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan to-neon-purple px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-neon-cyan/20"
          >
            {generating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={20} />
              </motion.div>
            ) : (
              <Sparkles size={20} />
            )}
            {generating ? 'Scanning...' : 'Generate Setups'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Status Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-xl p-4 border-l-4 cursor-pointer transition-all hover:scale-105 ${
            statusFilter === 'FORMING' ? 'border-neon-cyan bg-neon-cyan/10' : 'border-gray-600'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'FORMING' ? 'all' : 'FORMING')}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span className="text-xs text-gray-500 uppercase">Forming</span>
          </div>
          <div className="text-2xl font-bold text-neon-cyan">{getStatusCount('FORMING')}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass rounded-xl p-4 border-l-4 cursor-pointer transition-all hover:scale-105 ${
            statusFilter === 'NEAR TRIGGER' ? 'border-neon-yellow bg-neon-yellow/10' : 'border-gray-600'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'NEAR TRIGGER' ? 'all' : 'NEAR TRIGGER')}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse" />
            <span className="text-xs text-gray-500 uppercase">Near Trigger</span>
          </div>
          <div className="text-2xl font-bold text-neon-yellow">{getStatusCount('NEAR TRIGGER')}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass rounded-xl p-4 border-l-4 cursor-pointer transition-all hover:scale-105 ${
            statusFilter === 'TRIGGERED' ? 'border-neon-green bg-neon-green/10' : 'border-gray-600'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'TRIGGERED' ? 'all' : 'TRIGGERED')}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-neon-green" />
            <span className="text-xs text-gray-500 uppercase">Triggered</span>
          </div>
          <div className="text-2xl font-bold text-neon-green">{getStatusCount('TRIGGERED')}</div>
        </motion.div>

        {/* Bias Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`glass rounded-xl p-4 border-l-4 cursor-pointer transition-all hover:scale-105 ${
            biasFilter === 'Bullish' ? 'border-neon-green bg-neon-green/10' : 'border-gray-600'
          }`}
          onClick={() => setBiasFilter(biasFilter === 'Bullish' ? 'all' : 'Bullish')}
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-neon-green" />
            <span className="text-xs text-gray-500 uppercase">Bullish</span>
          </div>
          <div className="text-2xl font-bold text-neon-green">{stats?.byBias.bullish || 0}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`glass rounded-xl p-4 border-l-4 cursor-pointer transition-all hover:scale-105 ${
            biasFilter === 'Bearish' ? 'border-red-400 bg-red-400/10' : 'border-gray-600'
          }`}
          onClick={() => setBiasFilter(biasFilter === 'Bearish' ? 'all' : 'Bearish')}
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-red-400" />
            <span className="text-xs text-gray-500 uppercase">Bearish</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{stats?.byBias.bearish || 0}</div>
        </motion.div>

        {/* Avg Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-4 border-l-4 border-neon-purple"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-neon-purple" />
            <span className="text-xs text-gray-500 uppercase">Avg R:R</span>
          </div>
          <div className="text-2xl font-bold text-neon-purple">{stats?.avgRiskReward || '0.00'}</div>
        </motion.div>
      </div>

      {/* Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-neon-cyan" />
            <span className="font-semibold">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan text-xs rounded-full">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setBiasFilter('all')
                setRiskFilter('all')
                setStrategyFilter('all')
              }}
              className="text-xs text-neon-cyan hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
            >
              <option value="all">All Statuses</option>
              <option value="FORMING">Forming</option>
              <option value="NEAR TRIGGER">Near Trigger</option>
              <option value="TRIGGERED">Triggered</option>
            </select>
          </div>

          {/* Bias Filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bias</label>
            <select
              value={biasFilter}
              onChange={(e) => setBiasFilter(e.target.value)}
              className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
            >
              <option value="all">All Biases</option>
              <option value="Bullish">Bullish</option>
              <option value="Bearish">Bearish</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Risk Level</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
            >
              <option value="all">All Risk Levels</option>
              <option value="LOW">Low Risk (&lt;2.5%)</option>
              <option value="MEDIUM">Medium Risk (2.5-5%)</option>
              <option value="HIGH">High Risk (&gt;5%)</option>
            </select>
          </div>

          {/* Strategy Filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Strategy</label>
            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
            >
              <option value="all">All Strategies</option>
              {availableStrategies.map(strategy => (
                <option key={strategy} value={strategy}>{strategy}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Setups Grid */}
      {filteredSetups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-12 text-center border border-gray-700"
        >
          <Target className="mx-auto mb-4 text-gray-600" size={64} />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No setups match your filters</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filter criteria or generate new setups</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setStatusFilter('all')
                setBiasFilter('all')
                setRiskFilter('all')
                setStrategyFilter('all')
              }}
              className="px-4 py-2 bg-dark-700 rounded-lg text-neon-cyan hover:bg-dark-600 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white hover:opacity-90 transition-opacity"
            >
              Generate New
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredSetups.map((setup, index) => (
            <motion.div
              key={setup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SetupCard setup={setup} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Educational Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-xl p-6 border border-neon-cyan/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
            <BookOpen size={24} className="text-neon-cyan" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Understanding Trade Setups</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Each setup is generated using institutional price-action strategies including 
              <span className="text-neon-cyan"> Liquidity Sweeps</span>, 
              <span className="text-neon-cyan"> Fair Value Gaps</span>, 
              <span className="text-neon-cyan"> Market Structure Shifts</span>, and 
              <span className="text-neon-cyan"> Trend Continuation</span> patterns. 
              Confidence scores are calculated based on confluence factors—never trade on a single signal.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={14} className="text-neon-cyan" />
                <span><strong className="text-gray-300">FORMING:</strong> Early stage, watch for triggers</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <AlertTriangle size={14} className="text-neon-yellow" />
                <span><strong className="text-gray-300">NEAR TRIGGER:</strong> Price approaching entry</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Target size={14} className="text-neon-green" />
                <span><strong className="text-gray-300">TRIGGERED:</strong> Entry zone hit, active trade</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Layers size={14} className="text-neon-purple" />
                <span><strong className="text-gray-300">RISK:</strong> Based on stop distance</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default TradeSetupsContent
