import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Edit, Trash2, RefreshCw, X, BarChart3 } from 'lucide-react'
import api from '../lib/api'
import PortfolioStats from '../components/PortfolioStats'
import TradingViewChart from '../components/TradingViewChart'

export default function Journal() {
  const [trades, setTrades] = useState<any[]>([])
  const [marketData, setMarketData] = useState<{ [key: string]: any }>({})
  const [showModal, setShowModal] = useState(false)
  const [editingTrade, setEditingTrade] = useState<any>(null)
  const [viewingTrade, setViewingTrade] = useState<any>(null)
  const [formData, setFormData] = useState({
    asset: '',
    direction: 'long',
    entry: '',
    exit: '',
    size: '',
    notes: '',
    status: 'open'
  })

  useEffect(() => {
    loadTrades()
    loadMarketData()
    const interval = setInterval(loadMarketData, 30000) // Refresh prices every 30s
    return () => clearInterval(interval)
  }, [])

  const loadTrades = async () => {
    try {
      const { data } = await api.get('/trades')
      setTrades(data)
    } catch (error) {
      console.error('Failed to load trades')
    }
  }

  const loadMarketData = async () => {
    try {
      const { data } = await api.get('/market/overview')
      setMarketData(data.data || {})
    } catch (error) {
      console.error('Failed to load market data')
    }
  }

  const calculateUnrealizedPnL = (trade: any) => {
    if (trade.status !== 'open') return null
    const currentPrice = marketData[trade.asset]?.price
    if (!currentPrice) return null
    
    if (trade.direction === 'long') {
      return (currentPrice - trade.entry) * trade.size
    } else {
      return (trade.entry - currentPrice) * trade.size
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting trade:', formData, 'editing:', editingTrade)
    try {
      if (editingTrade) {
        console.log('Updating trade:', editingTrade.id, formData)
        await api.put(`/trades/${editingTrade.id}`, formData)
      } else {
        console.log('Creating new trade:', formData)
        await api.post('/trades', formData)
      }
      setShowModal(false)
      setEditingTrade(null)
      resetForm()
      loadTrades()
    } catch (error: any) {
      console.error('Failed to save trade:', error)
      console.error('Error response:', error.response?.data)
      alert('Failed to save trade: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this trade?')) {
      try {
        await api.delete(`/trades/${id}`)
        loadTrades()
      } catch (error) {
        console.error('Failed to delete trade')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      asset: '',
      direction: 'long',
      entry: '',
      exit: '',
      size: '',
      notes: '',
      status: 'open'
    })
  }

  const openEditModal = (trade: any) => {
    setEditingTrade(trade)
    setFormData({
      asset: trade.asset,
      direction: trade.direction,
      entry: trade.entry.toString(),
      exit: trade.exit?.toString() || '',
      size: trade.size.toString(),
      notes: trade.notes || '',
      status: trade.status
    })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Portfolio Tracker</h1>
          <p className="text-gray-400 mt-1">Track positions, P&L, and performance</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { loadTrades(); loadMarketData() }}
            className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm()
              setEditingTrade(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan to-neon-purple px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={20} />
            New Trade
          </button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <PortfolioStats trades={trades} marketData={marketData} />

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Asset</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Direction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Entry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Current</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Exit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Size</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">P&L</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {trades.map((trade) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setViewingTrade(trade)}
                  className="hover:bg-dark-700 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-semibold">{trade.asset}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {trade.direction === 'long' ? (
                        <TrendingUp className="text-neon-green" size={16} />
                      ) : (
                        <TrendingDown className="text-red-400" size={16} />
                      )}
                      <span className={trade.direction === 'long' ? 'text-neon-green' : 'text-red-400'}>
                        {trade.direction.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">${trade.entry.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {trade.status === 'open' && marketData[trade.asset]?.price ? (
                      <div>
                        <span className="text-neon-cyan">${marketData[trade.asset].price.toLocaleString()}</span>
                        {(() => {
                          const change = ((marketData[trade.asset].price - trade.entry) / trade.entry) * 100
                          return (
                            <div className={`text-xs ${change >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{trade.exit ? `$${trade.exit.toLocaleString()}` : '-'}</td>
                  <td className="px-6 py-4">{trade.size}</td>
                  <td className="px-6 py-4">
                    {trade.status === 'open' ? (
                      (() => {
                        const unrealized = calculateUnrealizedPnL(trade)
                        if (unrealized !== null) {
                          return (
                            <div>
                              <span className={unrealized >= 0 ? 'text-neon-cyan' : 'text-orange-400'}>
                                {unrealized >= 0 ? '+' : ''}${unrealized.toFixed(2)}
                              </span>
                              <div className="text-xs text-gray-500">Unrealized</div>
                            </div>
                          )
                        }
                        return <span className="text-gray-500">-</span>
                      })()
                    ) : trade.pnl !== null ? (
                      <div>
                        <span className={trade.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                        <div className="text-xs text-gray-500">
                          {trade.pnlPercent?.toFixed(2)}%
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trade.status === 'open' ? 'bg-neon-cyan/10 text-neon-cyan' : 'bg-red-400/10 text-red-400'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingTrade(trade);
                        }}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                        title="View Chart"
                      >
                        <BarChart3 size={16} className="text-gray-400 hover:text-neon-cyan" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(trade);
                        }}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="text-gray-400 hover:text-neon-cyan" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(trade.id);
                        }}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">{editingTrade ? 'Edit Trade' : 'New Trade'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Asset</label>
                <input
                  type="text"
                  value={formData.asset}
                  onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                  placeholder="BTC, ETH, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Direction</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entry}
                    onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                    className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Exit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.exit}
                    onChange={(e) => setFormData({ ...formData, exit: e.target.value })}
                    className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Position Size</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                  rows={3}
                  placeholder="Trade notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingTrade ? 'Update' : 'Create'} Trade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTrade(null)
                    resetForm()
                  }}
                  className="px-6 bg-dark-700 text-gray-400 font-semibold py-3 rounded-lg hover:bg-dark-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Trade Chart Viewing Modal */}
      <AnimatePresence>
        {viewingTrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingTrade(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    viewingTrade.direction === 'long' ? 'bg-neon-green/20' : 'bg-red-400/20'
                  }`}>
                    {viewingTrade.direction === 'long' ? (
                      <TrendingUp className="text-neon-green" size={24} />
                    ) : (
                      <TrendingDown className="text-red-400" size={24} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {viewingTrade.asset} Trade
                    </h2>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className={viewingTrade.direction === 'long' ? 'text-neon-green' : 'text-red-400'}>
                        {viewingTrade.direction.toUpperCase()}
                      </span>
                      <span className="text-gray-400">
                        Entry: ${viewingTrade.entry.toLocaleString()}
                      </span>
                      {viewingTrade.exit && (
                        <span className="text-gray-400">
                          Exit: ${viewingTrade.exit.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingTrade(null)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* TradingView Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-neon-cyan" />
                    Trade Chart - {viewingTrade.asset}
                  </h3>
                  <TradingViewChart symbol={viewingTrade.asset} theme="dark" />
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Entry Price</div>
                    <div className="text-lg font-semibold text-neon-cyan">
                      ${viewingTrade.entry.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">
                      {viewingTrade.status === 'open' ? 'Current Price' : 'Exit Price'}
                    </div>
                    <div className="text-lg font-semibold text-neon-cyan">
                      ${viewingTrade.status === 'open' 
                        ? (marketData[viewingTrade.asset]?.price || viewingTrade.entry).toLocaleString()
                        : viewingTrade.exit?.toLocaleString() || '-'
                      }
                    </div>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Position Size</div>
                    <div className="text-lg font-semibold text-white">
                      {viewingTrade.size}
                    </div>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className={`text-lg font-semibold ${
                      viewingTrade.status === 'open' ? 'text-neon-cyan' : 'text-gray-400'
                    }`}>
                      {viewingTrade.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* P&L Display */}
                {viewingTrade.status === 'open' ? (
                  (() => {
                    const unrealized = calculateUnrealizedPnL(viewingTrade);
                    if (unrealized !== null) {
                      return (
                        <div className="bg-dark-700/50 rounded-lg p-4 border border-neon-cyan/30">
                          <div className="text-sm text-gray-400 mb-1">Unrealized P&L</div>
                          <div className={`text-2xl font-bold ${unrealized >= 0 ? 'text-neon-cyan' : 'text-orange-400'}`}>
                            {unrealized >= 0 ? '+' : ''}${unrealized.toFixed(2)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                ) : viewingTrade.pnl !== null ? (
                  <div className={`rounded-lg p-4 border ${viewingTrade.pnl >= 0 ? 'bg-neon-green/10 border-neon-green/30' : 'bg-red-400/10 border-red-400/30'}`}>
                    <div className="text-sm text-gray-400 mb-1">Realized P&L</div>
                    <div className={`text-2xl font-bold ${viewingTrade.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                      {viewingTrade.pnl >= 0 ? '+' : ''}${viewingTrade.pnl.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {viewingTrade.pnlPercent?.toFixed(2)}% return
                    </div>
                  </div>
                ) : null}

                {/* Notes */}
                {viewingTrade.notes && (
                  <div className="bg-dark-700/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Trade Notes</div>
                    <p className="text-gray-300">{viewingTrade.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
