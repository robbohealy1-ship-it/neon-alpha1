import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get('/analytics/performance')
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neon-cyan animate-pulse">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Performance Analytics</h1>
        <p className="text-gray-400 mt-1">Track your trading performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-hover rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-neon-cyan" size={24} />
            <span className="text-xs text-gray-500">TOTAL TRADES</span>
          </div>
          <div className="text-3xl font-bold">{analytics.totalTrades}</div>
          <div className="text-sm text-gray-400 mt-1">
            {analytics.winningTrades}W / {analytics.losingTrades}L
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass glass-hover rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="text-neon-purple" size={24} />
            <span className="text-xs text-gray-500">WIN RATE</span>
          </div>
          <div className="text-3xl font-bold">{analytics.winRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-400 mt-1">Success ratio</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass glass-hover rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className={analytics.totalPnl >= 0 ? 'text-neon-green' : 'text-red-400'} size={24} />
            <span className="text-xs text-gray-500">TOTAL P&L</span>
          </div>
          <div className={`text-3xl font-bold ${analytics.totalPnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
            {analytics.totalPnl >= 0 ? '+' : ''}${analytics.totalPnl.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400 mt-1">All-time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass glass-hover rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Award className="text-yellow-400" size={24} />
            <span className="text-xs text-gray-500">R:R RATIO</span>
          </div>
          <div className="text-3xl font-bold">{analytics.riskRewardRatio.toFixed(2)}</div>
          <div className="text-sm text-gray-400 mt-1">Risk/Reward</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Performance Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <span className="text-gray-400">Average Win</span>
              <span className="text-neon-green font-semibold">+${analytics.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <span className="text-gray-400">Average Loss</span>
              <span className="text-red-400 font-semibold">-${analytics.avgLoss.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <span className="text-gray-400">Winning Trades</span>
              <span className="font-semibold">{analytics.winningTrades}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <span className="text-gray-400">Losing Trades</span>
              <span className="font-semibold">{analytics.losingTrades}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">P&L Chart</h2>
          {analytics.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#24243A" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid #24243A',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#00F0FF"
                  strokeWidth={2}
                  dot={{ fill: '#00F0FF', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No trade data available
            </div>
          )}
        </div>
      </div>

      {analytics.totalTrades === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <BarChart3 className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">No trades yet. Start logging your trades to see analytics!</p>
        </div>
      )}
    </div>
  )
}
