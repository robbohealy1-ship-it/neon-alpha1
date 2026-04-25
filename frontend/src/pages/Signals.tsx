import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Zap, Plus, Trophy, Bell, BellOff, History, XCircle, ChevronDown, BarChart3, Clock, Crown, Lock, ExternalLink, Activity } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import SignalCard from '../components/SignalCard'
import TradingViewChart from '../components/TradingViewChart'
import api from '../lib/api'
import { sendTelegramSignal, getTelegramStatus, getAlertHistory, checkRateLimit } from '../services/telegramService'
import { signalLimitService, SignalLimitStatus } from '../services/signalLimitService'
import { useAccessControl } from '../utils/accessControl'

interface Signal {
  id: string
  coin: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryMin: number
  entryMax: number
  stopLoss: number
  target1: number
  target2?: number
  target3?: number
  confidence: number
  setupType: string
  timeframe: string
  strategy: string
  status: 'FORMING' | 'TRIGGERED' | 'EXPIRED' | 'SUCCESS' | 'FAILED'
  ema50?: number
  ema200?: number
  rsi?: number
  volume?: number
  volumeAvg?: number
  createdAt: string
  updatedAt: string
  triggeredAt?: string
  expiresAt: string
  entryPrice?: number
  exitPrice?: number
  pnlPercent?: number
  isPreview?: boolean
  // Backward compatibility fields
  entry?: number
  takeProfit?: number
  winRate?: number
  reasoning?: string
}

interface AlertRecord {
  id: string
  coin: string
  direction: 'LONG' | 'SHORT'
  sentAt: string
  status: 'sent' | 'failed'
}

function SignalsContent() {
  const navigate = useNavigate()
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('ALL')
  const [generating, setGenerating] = useState(false)
  
  // Tier-based state
  const [tier, setTier] = useState('basic')
  
  // Access control and subscription status
  const { canUseTelegram, plan } = useAccessControl()
  
  // Available strategies (matching signal engine)
  const strategies = [
    { id: 'ALL', name: 'All Strategies', icon: BarChart3 },
    { id: 'EMA_TREND_PULLBACK', name: 'EMA Trend Pullback', icon: TrendingUp },
    { id: 'LIQUIDITY_SWEEP_REVERSAL_LONG', name: 'Liquidity Sweep (Long)', icon: TrendingUp },
    { id: 'LIQUIDITY_SWEEP_REVERSAL_SHORT', name: 'Liquidity Sweep (Short)', icon: TrendingDown },
    { id: 'RANGE_BREAKOUT', name: 'Range Breakout', icon: Zap },
    { id: 'MSS', name: 'Market Structure Shift', icon: BarChart3 },
    { id: 'FVG', name: 'Fair Value Gap', icon: BarChart3 },
    { id: 'LIQUIDITY_STRUCTURE', name: 'Liquidity + Structure', icon: Zap }
  ]
  
  // Telegram integration state
  const [telegramEnabled, setTelegramEnabled] = useState(() => {
    return localStorage.getItem('telegramAlertsEnabled') === 'true'
  })
  const [telegramStatus, setTelegramStatus] = useState({
    configured: false,
    canSendMessages: false
  })
  const [alertHistory, setAlertHistory] = useState<AlertRecord[]>([])
  const [sendingAlert, setSendingAlert] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    highConfidence: 0,
    active: 0,
    today: 0
  })
  
  // Signal limit state
  const [signalLimit, setSignalLimit] = useState<SignalLimitStatus | null>(null)
  const [limitLoading, setLimitLoading] = useState(true)
  
  // Load signal limit status
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      loadSignalLimit()
    } else {
      setLimitLoading(false)
      setSignalLimit({
        allowed: true,
        signalsViewed: 0,
        remainingFree: 1,
        limitReached: false,
        isPaidUser: false,
        freeLimit: 1
      })
    }
  }, [])

  const loadSignalLimit = async () => {
    try {
      const status = await signalLimitService.getStatus()
      setSignalLimit(status)
    } catch (error) {
      console.error('Failed to load signal limit:', error)
    } finally {
      setLimitLoading(false)
    }
  }
  
  useEffect(() => {
    loadSignals()
    loadTelegramStatus()
    loadAlertHistory()
    
    // Refresh signals every 30 seconds
    const interval = setInterval(() => {
      loadSignals()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [highConfidenceOnly, selectedStrategy])
  
  const loadTelegramStatus = async () => {
    const status = await getTelegramStatus()
    setTelegramStatus(status)
  }
  
  const loadAlertHistory = async () => {
    const history = await getAlertHistory(10)
    setAlertHistory(history.alerts)
  }
  
  const handleToggleTelegram = () => {
    const newValue = !telegramEnabled
    setTelegramEnabled(newValue)
    localStorage.setItem('telegramAlertsEnabled', newValue.toString())
  }
  
  const handleSendAlert = async (signal: Signal) => {
    if (!canUseTelegram) {
      alert('Telegram alerts require a PRO subscription')
      return
    }
    if (!telegramEnabled || !telegramStatus.canSendMessages) {
      alert('Please enable Telegram alerts and ensure bot is configured')
      return
    }
    
    setSendingAlert(signal.id)
    
    // Check rate limit first
    const rateLimit = await checkRateLimit(signal.coin)
    if (!rateLimit.canSend) {
      alert(`Rate limit: Please wait ${rateLimit.minutesRemaining} minutes before sending another alert for ${signal.coin}`)
      setSendingAlert(null)
      return
    }
    
    const result = await sendTelegramSignal({
      coin: signal.coin,
      direction: signal.direction,
      entry: signal.entry || ((signal.entryMin + signal.entryMax) / 2),
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit || signal.target1,
      confidence: signal.confidence,
      strategy: signal.strategy
    })
    
    if (result.success) {
      // Refresh alert history
      loadAlertHistory()
    } else {
      alert(result.message)
    }
    
    setSendingAlert(null)
  }

  const loadSignals = async () => {
    try {
      const token = localStorage.getItem('token');
      let data;
      let isPreview = false;
      let responseTier = 'basic';

      if (!token) {
        // Use public preview for non-logged in users
        const response = await api.get('/signals/public/preview');
        data = response.data.signals || [];
        isPreview = true;
      } else {
        // Use full endpoint for logged-in users
        try {
          const response = await api.get('/signals');
          // Handle new API response format with tier info
          if (response.data.signals) {
            data = response.data.signals;
            responseTier = response.data.tier || 'basic';
          } else {
            // Fallback for old format
            data = response.data;
          }
        } catch (err: any) {
          // If 401, fall back to public preview
          if (err.response?.status === 401) {
            const response = await api.get('/signals/public/preview');
            data = response.data.signals || [];
            isPreview = true;
          } else {
            throw err;
          }
        }
      }

      setTier(responseTier);

      // Transform backend signals to new format
      const transformedSignals = data.map((s: any) => ({
        id: s.id,
        coin: s.coin,
        symbol: s.symbol || s.coin,
        direction: s.direction,
        entryMin: s.entryMin || (s.entry ? s.entry * 0.998 : undefined),
        entryMax: s.entryMax || (s.entry ? s.entry * 1.002 : undefined),
        stopLoss: s.stopLoss || (isPreview ? 'Upgrade to view' : undefined),
        target1: s.target1 || s.takeProfit || s.takeProfit1 || (isPreview ? 'Upgrade to view' : undefined),
        target2: s.target2 || s.takeProfit2,
        target3: s.target3 || s.takeProfit3,
        confidence: Math.round(s.confidence || 75),
        setupType: s.setupType || s.strategy || 'Technical Analysis',
        timeframe: s.timeframe || '4H',
        strategy: s.strategy || 'Trend Following',
        status: s.status?.toUpperCase() || 'FORMING',
        ema50: s.ema50,
        ema200: s.ema200,
        rsi: s.rsi,
        volume: s.volume,
        volumeAvg: s.volumeAvg,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        triggeredAt: s.triggeredAt,
        expiresAt: s.expiresAt || new Date(new Date(s.createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        entryPrice: s.entryPrice,
        exitPrice: s.exitPrice,
        pnlPercent: s.pnlPercent,
        isPreview: isPreview || s.isPreview,
        // Backward compatibility
        entry: s.entry || ((s.entryMin + s.entryMax) / 2),
        takeProfit: s.target1 || s.takeProfit,
        winRate: 75, // Default win rate
        reasoning: `${s.setupType || s.strategy || 'Technical'} on ${s.timeframe || '4H'} timeframe`
      }))
      
      // Apply filters
      let filtered = transformedSignals
      
      if (highConfidenceOnly) {
        filtered = filtered.filter((s: Signal) => s.confidence >= 70)
      }
      
      if (selectedStrategy !== 'ALL') {
        filtered = filtered.filter((s: Signal) => s.setupType?.includes(selectedStrategy) || s.strategy?.includes(selectedStrategy))
      }
      
      setSignals(filtered)
      
      // Update stats
      setStats({
        total: filtered.length,
        highConfidence: filtered.filter((s: Signal) => s.confidence >= 80).length,
        active: filtered.filter((s: Signal) => s.status === 'FORMING' || s.status === 'TRIGGERED').length,
        today: filtered.filter((s: Signal) => {
          const created = new Date(s.createdAt)
          const today = new Date()
          return created.toDateString() === today.toDateString()
        }).length
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to load signals:', error)
      // Show empty state instead of mock data
      setSignals([]);
      setLoading(false);
    }
  }
  
  const handleGenerateSignals = async () => {
    setGenerating(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    await loadSignals()
    setGenerating(false)
  }
  
  const filteredSignals = signals
  
  return (
    <div className="space-y-6">
      {/* Aggressive Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-black text-gradient tracking-tight">
              SIGNALS
            </h1>
            {/* Subscription Badge */}
            {plan && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                plan === 'pro' 
                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40' 
                  : plan === 'basic'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
              }`}>
                {plan === 'pro' && <Crown size={12} />}
                {plan === 'pro' ? 'PRO' : plan === 'basic' ? 'BASIC' : 'FREE'}
              </div>
            )}
          </div>
          <p className="text-gray-400 mt-1 flex items-center gap-2 text-sm">
            <Zap size={16} className="text-neon-yellow" />
            Execution Signals from Trade Setups • Ready to trade opportunities
          </p>
          <p className="text-xs text-gray-500 mt-0.5 ml-6">
            Generated when price enters HTF setup zones • Lower timeframe confirmation
          </p>
          <p className="text-xs text-gray-500/70 mt-0.5 ml-6">
            Setup Timeframes: 1H → Signal 15m | 4H → Signal 1h | 1D → Signal 4h
          </p>
          
          {/* Free Signal Limit Notification */}
          {!limitLoading && signalLimit && !signalLimit.isPaidUser && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${
              signalLimit.limitReached ? 'text-neon-yellow' : 'text-gray-400'
            }`}>
              <Lock size={14} />
              {signalLimit.limitReached ? (
                <span>Daily limit reached. <button className="text-neon-cyan hover:underline">Upgrade to Active Trader for unlimited</button></span>
              ) : (
                <span>Starter: {signalLimit.remainingFree} signal remaining today</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Telegram Toggle - Click to enable/disable alerts */}
          <div className="group relative">
            <button
              onClick={handleToggleTelegram}
              className={`glass rounded-lg px-4 py-2 flex items-center gap-2 transition-all hover:scale-105 ${
                telegramEnabled && telegramStatus.canSendMessages
                  ? 'border-neon-green/50 bg-neon-green/10' 
                  : 'border-gray-600 hover:border-neon-cyan/50'
              }`}
            >
              {telegramEnabled && telegramStatus.canSendMessages ? (
                <Bell size={16} className="text-neon-green" />
              ) : (
                <BellOff size={16} className="text-gray-400" />
              )}
              <span className={`text-sm ${
                telegramEnabled && telegramStatus.canSendMessages ? 'text-neon-green' : 'text-gray-400'
              }`}>
                {telegramEnabled && telegramStatus.canSendMessages ? 'Alerts ON' : 'Alerts OFF'}
              </span>
            </button>
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {telegramEnabled && telegramStatus.canSendMessages 
                ? 'Click to disable Telegram alerts' 
                : telegramStatus.canSendMessages 
                  ? 'Click to enable Telegram alerts for new signals'
                  : 'Telegram bot not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to backend .env'}
            </div>
          </div>
          
          {/* High Confidence Toggle */}
          <div className="group relative">
            <button
              onClick={() => setHighConfidenceOnly(!highConfidenceOnly)}
              className={`glass rounded-lg px-4 py-2 flex items-center gap-2 transition-all hover:scale-105 ${
                highConfidenceOnly ? 'border-neon-purple/50 bg-neon-purple/10' : 'hover:border-neon-purple/30'
              }`}
            >
              <Trophy size={16} className={highConfidenceOnly ? 'text-neon-purple' : 'text-gray-400'} />
              <span className={`text-sm ${highConfidenceOnly ? 'text-neon-purple' : 'text-gray-400'}`}>
                High Confidence Only
              </span>
            </button>
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {highConfidenceOnly 
                ? 'Showing only signals with 70%+ confidence' 
                : 'Click to filter: Show only high-confidence signals (70%+) based on confluence analysis'}
            </div>
          </div>
          
          {/* Strategy Selector Dropdown */}
          <div className="group relative">
            <div className="relative">
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="appearance-none glass rounded-lg px-4 py-2 pr-10 text-sm cursor-pointer hover:border-neon-cyan/50 transition-all focus:outline-none focus:border-neon-cyan"
              >
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
              <ChevronDown 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
              />
            </div>
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Filter signals by strategy type. Choose from EMA Trend Pullback, Liquidity Sweep (Long/Short), Range Breakout, or higher timeframe setups (MSS, FVG, Liquidity+Structure).
            </div>
          </div>
          
          {/* Generate Signals Button */}
          <div className="group relative">
            <button
              onClick={handleGenerateSignals}
              disabled={generating}
              className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105"
            >
              {generating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock size={18} />
                </motion.div>
              ) : (
                <Plus size={18} />
              )}
              {generating ? 'Scanning...' : 'Generate New'}
            </button>
            {/* Tooltip */}
            <div className="absolute top-full mt-2 right-0 w-64 p-2 bg-dark-700 border border-gray-600 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {generating 
                ? 'Scanning 100+ coins across 4 timeframes with EMA, RSI, ATR, Volume analysis...' 
                : 'Generate up to 5 signals/day from 100+ coins: EMA Trend Pullback, Liquidity Sweep, Range Breakout + HTF Setups'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Alert History Panel */}
      {alertHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass rounded-xl p-4 border border-neon-cyan/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-neon-cyan" />
            <h3 className="text-sm font-semibold text-neon-cyan">Recent Telegram Alerts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertHistory.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                  alert.status === 'sent'
                    ? 'bg-neon-green/10 border border-neon-green/30'
                    : 'bg-red-400/10 border border-red-400/30'
                }`}
              >
                {alert.status === 'sent' ? (
                  <Trophy size={12} className="text-neon-green" />
                ) : (
                  <XCircle size={12} className="text-red-400" />
                )}
                <span className="font-semibold">{alert.coin.replace('USDT', '')}</span>
                <span className={alert.direction === 'LONG' ? 'text-neon-green' : 'text-red-400'}>
                  {alert.direction}
                </span>
                <span className="text-gray-500">
                  {new Date(alert.sentAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border-l-4 border-neon-cyan"
        >
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500 uppercase">Active Signals</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 border-l-4 border-neon-green"
        >
          <div className="text-2xl font-bold text-neon-green">{stats.highConfidence}</div>
          <div className="text-xs text-gray-500 uppercase">High Confidence (80%+)</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 border-l-4 border-neon-purple"
        >
          <div className="text-2xl font-bold text-neon-purple">{stats.active}</div>
          <div className="text-xs text-gray-500 uppercase">Valid Until Expiry</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4 border-l-4 border-neon-yellow"
        >
          <div className="text-2xl font-bold text-neon-yellow">{stats.today}</div>
          <div className="text-xs text-gray-500 uppercase">Generated Today</div>
        </motion.div>
      </div>
      
      {/* Signal Cards Grid */}
      {loading ? (
        <div className="glass rounded-xl p-16 text-center">
          <motion.div
            className="w-12 h-12 mx-auto mb-4 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="text-neon-cyan font-semibold">Loading Signals...</div>
          <div className="text-gray-500 text-sm mt-2">Scanning markets for opportunities</div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-12 text-center border-2 border-dashed border-gray-600"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-600 flex items-center justify-center">
            <Zap size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">No Active Signals</h3>
          <p className="text-gray-500 mb-2 max-w-md mx-auto">
            Signals are generated when price enters a Trade Setup zone. Check the Trade Setups page for high-probability zones waiting to trigger.
          </p>
          <p className="text-xs text-gray-600 mb-6 max-w-md mx-auto">
            Signals appear automatically when market price reaches setup entry zones. No signals = no setups currently triggering.
          </p>
          <button
            onClick={handleGenerateSignals}
            disabled={generating}
            className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {generating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Clock size={18} />
              </motion.div>
            ) : (
              <TrendingUp size={18} />
            )}
            {generating ? 'Scanning Markets...' : 'Generate Signals Now'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSignals.map((signal, index) => {
            // Only block for STARTER tier - show all signals for basic, pro, lifetime
            const isStarterTier = tier === 'starter'
            const isBlurred = isStarterTier && index > 0
            
            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={isBlurred ? 'relative' : ''}
              >
                {/* Signal Card - Always full access for basic+ tiers */}
                <div className={isBlurred ? 'blur-md pointer-events-none' : ''}>
                  <SignalCard 
                    signal={signal} 
                    onSelect={isBlurred ? undefined : setSelectedSignal}
                    onSendAlert={telegramEnabled && telegramStatus.canSendMessages ? handleSendAlert : undefined}
                    sendingAlert={sendingAlert === signal.id}
                    telegramEnabled={telegramEnabled && telegramStatus.canSendMessages}
                  />
                </div>
                
                {/* Paywall Overlay - Only for Starter Tier */}
                {isBlurred && (
                  <div 
                    onClick={() => navigate('/pricing')}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800/70 rounded-xl p-4 backdrop-blur-sm cursor-pointer hover:bg-dark-800/85 transition-all group border border-neon-purple/30"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-purple to-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-bold text-white text-center">Starter: 1 Signal Only</p>
                    <p className="text-xs text-gray-400 text-center mt-1">Upgrade to see all {filteredSignals.length} signals</p>
                    <button className="mt-4 px-5 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg text-white text-xs font-bold hover:scale-105 transition-transform shadow-lg">
                      Upgrade to Basic
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* Paywall CTA for STARTER Tier Users - 1 signal limit */}
      {(tier === 'starter' && filteredSignals.length > 1) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 glass rounded-2xl p-8 border border-neon-cyan/30 bg-gradient-to-r from-neon-cyan/10 to-transparent"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Lock className="w-5 h-5 text-neon-cyan" />
                <h3 className="text-xl font-bold text-white">Unlock All {filteredSignals.length} Signals</h3>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                Starter tier: Limited to 1 signal. Upgrade to Basic for {filteredSignals.length}+ active signals and full access.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start text-xs text-gray-500">
                <span className="flex items-center gap-1"><Zap size={12} className="text-neon-yellow" /> All signals unlocked</span>
                <span className="flex items-center gap-1"><TrendingUp size={12} className="text-neon-green" /> Full trade setups</span>
                <span className="flex items-center gap-1"><Bell size={12} className="text-neon-cyan" /> Basic analytics</span>
              </div>
            </div>
            <Link 
              to="/pricing"
              className="px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl font-bold text-white hover:scale-105 transition-transform whitespace-nowrap"
            >
              Upgrade to Basic
            </Link>
          </div>
        </motion.div>
      )}
      
      {/* Signal Detail Modal */}
      <AnimatePresence>
        {selectedSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSignal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://assets.coingecko.com/coins/images/1/small/${selectedSignal.coin.toLowerCase().replace('usdt', '').replace('usd', '')}.png`}
                    alt={selectedSignal.coin}
                    className="w-12 h-12 rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedSignal.coin.replace('USDT', '')}</h2>
                    <p className={`text-sm ${selectedSignal.direction === 'LONG' ? 'text-neon-green' : 'text-red-400'}`}>
                      {selectedSignal.direction} • {selectedSignal.timeframe} • {selectedSignal.setupType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Trade Levels Bar */}
              <div className="px-6 py-3 border-b border-gray-700/50">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-neon-cyan/30 border border-neon-cyan"></span>
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-neon-cyan font-semibold">
                      ${((selectedSignal.entryMin + selectedSignal.entryMax) / 2).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-400/30 border border-red-400"></span>
                    <span className="text-gray-400">SL:</span>
                    <span className="text-red-400 font-semibold">${selectedSignal.stopLoss.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-neon-green/30 border border-neon-green"></span>
                    <span className="text-gray-400">TP:</span>
                    <span className="text-neon-green font-semibold">${selectedSignal.target1.toFixed(4)}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="font-bold text-neon-purple">{selectedSignal.confidence}%</span>
                  </div>
                  <a
                    href={`https://www.tradingview.com/chart/?symbol=BINANCE:${selectedSignal.coin}&interval=60`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Open in TradingView
                  </a>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* TradingView Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity size={20} className="text-neon-cyan" />
                    Price Chart
                  </h3>
                  <div className="h-[400px]">
                    <TradingViewChart symbol={selectedSignal.coin.replace('USDT', '').replace('USD', '')} theme="dark" />
                  </div>
                </div>

                {/* Trade Details Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4 text-center border border-gray-700/50">
                    <div className="text-xs text-gray-400 mb-1">Entry Range</div>
                    <div className="text-lg font-bold text-neon-cyan">
                      ${selectedSignal.entryMin?.toLocaleString()} - ${selectedSignal.entryMax?.toLocaleString()}
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center border border-gray-700/50">
                    <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                    <div className="text-lg font-bold text-red-400">${selectedSignal.stopLoss.toLocaleString()}</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center border border-gray-700/50">
                    <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                    <div className="text-lg font-bold text-neon-green">${selectedSignal.target1.toLocaleString()}</div>
                  </div>
                </div>
                
                {/* Risk Metrics */}
                <div className="glass rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Risk/Reward Ratio</span>
                    <span className="font-bold text-neon-purple">
                      {(() => {
                        const risk = Math.abs(((selectedSignal.entryMin + selectedSignal.entryMax) / 2) - selectedSignal.stopLoss)
                        const reward = Math.abs(selectedSignal.target1 - ((selectedSignal.entryMin + selectedSignal.entryMax) / 2))
                        return risk > 0 ? (reward / risk).toFixed(2) : 'N/A'
                      })()}:1
                    </span>
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-neon-cyan to-neon-purple h-2 rounded-full"
                      style={{ width: `${selectedSignal.confidence}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Risk Assessment</span>
                    <span>{selectedSignal.confidence}% Confidence</span>
                  </div>
                </div>
                
                {/* Strategy Info */}
                <div className="glass rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={16} className="text-neon-cyan" />
                    <span className="font-semibold">Strategy: {selectedSignal.setupType}</span>
                  </div>
                  <p className="text-sm text-gray-400">{selectedSignal.reasoning || selectedSignal.strategy}</p>
                </div>
                
                {/* Action Button */}
                <button
                  onClick={() => {
                    const text = `${selectedSignal.coin.replace('USDT', '')} ${selectedSignal.direction} | Entry: ${((selectedSignal.entryMin + selectedSignal.entryMax) / 2).toFixed(2)} | SL: ${selectedSignal.stopLoss.toFixed(2)} | TP: ${selectedSignal.target1.toFixed(2)}`
                    navigator.clipboard.writeText(text)
                  }}
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Copy Trade Text
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Export content directly - Layout uses Outlet pattern
export default SignalsContent
