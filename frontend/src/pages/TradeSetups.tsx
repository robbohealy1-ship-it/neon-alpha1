import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Lock, Minus } from 'lucide-react'
import SetupList from '../components/setups/SetupList'
import SetupFilters from '../components/setups/SetupFilters'
import ChartModal from '../components/chart/ChartModal'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface Setup {
  id: string
  coin: string
  symbol: string
  bias: 'Bullish' | 'Bearish'
  entryZone: { low: number; high: number }
  entryPrice: number
  stopLoss: number
  targets: number[]
  confidence: number
  status: 'FORMING' | 'NEAR TRIGGER' | 'TRIGGERED' | 'EXPIRED'
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
    FORMING: number
    'NEAR TRIGGER': number
    TRIGGERED: number
    EXPIRED: number
  }
}

export default function TradeSetups() {
  const navigate = useNavigate()
  const [setups, setSetups] = useState<Setup[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tier, setTier] = useState('basic')
  const [limitReached, setLimitReached] = useState(false)
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [marketStatus, setMarketStatus] = useState<{status: 'Bullish' | 'Bearish' | 'Neutral', icon: 'trending' | 'trending-down' | 'minus'}>({status: 'Neutral', icon: 'minus'})
  
  // Get user from auth store
  const { user } = useAuthStore()
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [biasFilter, setBiasFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Scan status
  const [scanStatus, setScanStatus] = useState<any>(null)

  useEffect(() => {
    loadSetups()
    loadStats()
    loadScanStatus()
  }, [])
  
  const loadScanStatus = async () => {
    try {
      const { data } = await api.get('/setups/scan-status')
      setScanStatus(data)
    } catch (err) {
      console.error('Failed to load scan status:', err)
    }
  }

  const loadSetups = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/setups')
      // Handle new API response format
      if (data.setups) {
        setSetups(data.setups)
        setTier(data.tier || 'basic')
        setLimitReached(data.limitReached || false)
        setTotalAvailable(data.totalAvailable || data.setups.length)
        
        // Calculate stable market status based on setups
        const bullishCount = data.setups.filter((s: Setup) => s.bias === 'Bullish').length
        const bearishCount = data.setups.filter((s: Setup) => s.bias === 'Bearish').length
        const total = data.setups.length
        
        if (total > 0) {
          const bullishRatio = bullishCount / total
          const bearishRatio = bearishCount / total
          
          if (bullishRatio > 0.6) {
            setMarketStatus({status: 'Bullish', icon: 'trending'})
          } else if (bearishRatio > 0.6) {
            setMarketStatus({status: 'Bearish', icon: 'trending-down'})
          } else {
            setMarketStatus({status: 'Neutral', icon: 'minus'})
          }
        }
        
        if (data.setups.length > 0 && !selectedId) {
          setSelectedId(data.setups[0].id)
        }
      } else {
        // Fallback for old format
        setSetups(data)
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id)
        }
      }
    } catch (err: any) {
      console.error('Failed to load setups:', err)
      if (err.response?.status === 503) {
        setSetups([]) // Clear stale data
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await api.get('/setups/stats')
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const filteredSetups = setups.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (biasFilter !== 'all' && s.bias.toLowerCase() !== biasFilter.toLowerCase()) return false
    if (searchQuery && !s.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const selectedSetup = setups.find(s => s.id === selectedId) || null
  
  // Determine if selected setup is locked (index >= 2 for BASIC tier)
  const selectedSetupIndex = selectedId ? setups.findIndex(s => s.id === selectedId) : -1
  const selectedSetupLocked = (user?.tier || tier) === 'basic' && selectedSetupIndex >= 2

  return (
    <div className="flex h-screen bg-dark-800">
      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-dark-800/50">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              TRADE <span className="text-neon-cyan">SETUPS</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              High probability setups identified by Neon Alpha algorithms
            </p>
            {scanStatus && (
              <p className="text-xs text-neon-cyan mt-1">
                Auto-scan every {scanStatus.scanFrequency} • Next scan in {scanStatus.hoursRemaining}h
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="glass rounded-lg px-4 py-2 flex items-center gap-3">
              <div>
                <div className="text-xs text-gray-500">Market Status</div>
                {marketStatus.status === 'Bullish' ? (
                  <div className="text-sm font-semibold text-neon-green flex items-center gap-1">
                    <TrendingUp size={14} />
                    Bullish
                  </div>
                ) : marketStatus.status === 'Bearish' ? (
                  <div className="text-sm font-semibold text-red-400 flex items-center gap-1">
                    <TrendingDown size={14} />
                    Bearish
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-neon-yellow flex items-center gap-1">
                    <Minus size={14} />
                    Neutral
                  </div>
                )}
              </div>
            </div>
            
            <span className="text-xs text-gray-500">
              Auto-refreshed every {scanStatus?.scanFrequency || '4 hours'}
            </span>
          </div>
        </div>

        {/* Main Content - Two Panel Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL - 30% */}
          <div className="w-[30%] flex flex-col min-h-0 border-r border-gray-700/50 bg-dark-800/30">
            <SetupFilters
              statusFilter={statusFilter}
              biasFilter={biasFilter}
              searchQuery={searchQuery}
              onStatusChange={setStatusFilter}
              onBiasChange={setBiasFilter}
              onSearchChange={setSearchQuery}
              totalCount={stats?.total || setups.length}
              formingCount={stats?.byStatus.FORMING || 0}
              nearTriggerCount={stats?.byStatus['NEAR TRIGGER'] || 0}
              triggeredCount={stats?.byStatus.TRIGGERED || 0}
            />
            
            <div className="flex-1 overflow-y-auto">
              <SetupList
                setups={filteredSetups}
                selectedId={selectedId}
                onSelect={setSelectedId}
                loading={loading}
                tier={user?.tier || tier}
              />
            </div>
            
            {/* Upgrade Prompt when limit reached */}
            {limitReached && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-purple/30">
                    <Lock size={20} className="text-neon-cyan" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      🔒 {tier === 'basic' ? 'Starter' : tier === 'lifetime' ? 'Alpha Access' : 'Active Trader'}: {totalAvailable} setups available — you see {tier === 'basic' ? '2' : tier === 'lifetime' ? '12' : '6'}
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      {tier === 'basic' 
                        ? 'Upgrade to Active Trader for 6 setups, or Alpha Access for all 12 + lifetime access.' 
                        : tier === 'lifetime'
                          ? 'You have full Alpha Access with all 12 setups, Alpha Picks research, and lifetime updates.'
                          : 'Upgrade to Alpha Access for all 12 setups, Alpha Picks research, and lifetime updates.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/pricing')}
                    className="px-4 py-2 bg-neon-cyan text-dark-900 rounded-lg text-sm font-semibold hover:bg-neon-cyan/90 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {tier === 'basic' ? 'Unlock More' : tier === 'lifetime' ? 'Full Access' : 'Go Alpha'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT PANEL - 70% for TradingView */}
          <div className="w-[70%] bg-dark-900/50">
            <ChartModal 
              setup={selectedSetup} 
              onClose={() => setSelectedId(null)}
              tier={user?.tier || tier}
              locked={selectedSetupLocked}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
