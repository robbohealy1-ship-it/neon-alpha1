import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Star, Trash2 } from 'lucide-react'
import api from '../lib/api'

const CRYPTO_LOGOS: { [key: string]: string } = {
  'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'MATIC': 'https://assets.coingecko.com/coins/images/4713/large/polygon-matic-logo.png',
  'LINK': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  'DOT': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  'LTC': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  'BCH': 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash.png',
  'UNI': 'https://assets.coingecko.com/coins/images/12504/large/uniswap.png',
  'AAVE': 'https://assets.coingecko.com/coins/images/12645/large/aave.png',
  'SUSHI': 'https://assets.coingecko.com/coins/images/12271/large/sushi.png',
  'COMP': 'https://assets.coingecko.com/coins/images/10775/large/comp.png',
  'MKR': 'https://assets.coingecko.com/coins/images/1364/large/mkr.png',
  'ATOM': 'https://assets.coingecko.com/coins/images/1481/large/cosmos.png',
  'NEAR': 'https://assets.coingecko.com/coins/images/10365/large/near.png',
  'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  'ETC': 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  'FIL': 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png',
  'APT': 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  'OP': 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  'ARB': 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
  'SUI': 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg',
  'TON': 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
  'ICP': 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
  'PEPE': 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
  'HYPE': 'https://via.placeholder.com/40?text=HYPE&bg=00F0FF&color=fff'
}

export default function Watchlist() {
  const [items, setItems] = useState<any[]>(JSON.parse(localStorage.getItem('watchlist') || '[]'))
  const [marketData, setMarketData] = useState<any>({})
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    symbol: '',
    sentiment: 'neutral',
    notes: ''
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    // Load market data periodically
    const interval = setInterval(loadMarketData, 5000)
    loadMarketData()
    return () => clearInterval(interval)
  }, [])

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(items))
  }, [items])

  const loadMarketData = async () => {
    try {
      const { data } = await api.get('/market/overview')
      setMarketData(data)
    } catch (error) {
      console.error('Failed to load market data')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Add item to localStorage only
    const newItem = {
      id: Date.now().toString(),
      symbol: formData.symbol.toUpperCase(),
      sentiment: formData.sentiment,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    }
    setItems([...items, newItem])
    setShowModal(false)
    setFormData({ symbol: '', sentiment: 'neutral', notes: '' })
  }

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateSentiment = (id: string, sentiment: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, sentiment } : item
    ))
  }

  const searchCrypto = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const { data } = await api.get(`/market/search/${query}`)
      setSearchResults(data.coins || [])
    } catch (error) {
      console.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const selectCoin = (symbol: string) => {
    setFormData({ ...formData, symbol })
    setSearchResults([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Watchlist</h1>
          <p className="text-gray-400 mt-1">Track your favorite assets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan to-neon-purple px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => {
          const market = marketData[item.symbol]
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="glass glass-hover rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={CRYPTO_LOGOS[item.symbol.toUpperCase()] || 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'}
                    alt={item.symbol}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
                    }}
                  />
                  <div>
                    <div className="font-bold text-lg">{item.symbol}</div>
                    {market && (
                      <div className="text-sm text-gray-500">
                        ${market.price.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                </button>
              </div>

              {market && (
                <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">24h Change</span>
                    <span className={`font-semibold ${market.change24h >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                      {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs text-gray-500 uppercase mb-2">Sentiment</div>
                <div className="flex gap-2">
                  {['bullish', 'neutral', 'bearish'].map((sentiment) => {
                    const isActive = item.sentiment === sentiment
                    const activeStyles = sentiment === 'bullish' 
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                      : sentiment === 'bearish'
                      ? 'bg-red-400/20 text-red-400 border border-red-400/50'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                    
                    return (
                      <button
                        key={sentiment}
                        onClick={() => updateSentiment(item.id, sentiment)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive ? activeStyles : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                        }`}
                      >
                        {sentiment}
                      </button>
                    )
                  })}
                </div>
              </div>

              {item.notes && (
                <div className="mt-4 p-3 bg-dark-700/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">{item.notes}</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {items.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Star className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">Your watchlist is empty. Add some assets to track!</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">Add to Watchlist</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm text-gray-400 mb-2">Asset Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    setFormData({ ...formData, symbol: value })
                    searchCrypto(value)
                  }}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                  placeholder="Search BTC, ETH, SOL..."
                  required
                />
                {searching && (
                  <div className="absolute right-3 top-9 text-xs text-gray-500">Searching...</div>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute w-full mt-1 bg-dark-800 border border-gray-700 rounded-lg max-h-48 overflow-y-auto z-10">
                    {searchResults.map((coin) => (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => selectCoin(coin.symbol)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-dark-700 transition-colors text-left"
                      >
                        <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />
                        <div>
                          <div className="font-semibold">{coin.symbol}</div>
                          <div className="text-xs text-gray-500">{coin.name}</div>
                        </div>
                        {coin.marketCapRank && (
                          <div className="ml-auto text-xs text-neon-cyan">#{coin.marketCapRank}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Initial Sentiment</label>
                <select
                  value={formData.sentiment}
                  onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                >
                  <option value="bullish">Bullish</option>
                  <option value="neutral">Neutral</option>
                  <option value="bearish">Bearish</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                  rows={3}
                  placeholder="Why are you watching this asset?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add to Watchlist
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({ symbol: '', sentiment: 'neutral', notes: '' })
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
    </div>
  )
}
