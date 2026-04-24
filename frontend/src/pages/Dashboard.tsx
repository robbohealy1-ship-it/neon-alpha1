import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Zap, Clock, X, ExternalLink, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import TradingViewChart from '../components/TradingViewChart'
import ExchangeLinks from '../components/ExchangeLinks'
import FearGreedGauge from '../components/FearGreedGauge'

interface TickerData {
  symbol: string
  price: number
  change24h: number
  image: string
}

interface MarketData {
  data: { [key: string]: any }
  topGainers: any[]
  topLosers: any[]
  lastUpdated: string
}

export default function Dashboard() {
  const [marketData, setMarketData] = useState<MarketData>({ data: {}, topGainers: [], topLosers: [], lastUpdated: '' })
  const [sentiment, setSentiment] = useState<any>({})
  const [tickerData, setTickerData] = useState<TickerData[]>([])
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)
  const [tickerCoinMenu, setTickerCoinMenu] = useState<{ symbol: string; x: number; y: number } | null>(null)
  const [sentimentModalOpen, setSentimentModalOpen] = useState(false)
  const [fearGreedModalOpen, setFearGreedModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    loadTicker()
    const dataInterval = setInterval(loadData, 30000)
    const tickerInterval = setInterval(loadTicker, 30000)
    return () => {
      clearInterval(dataInterval)
      clearInterval(tickerInterval)
    }
  }, [])

  const loadData = async () => {
    try {
      const [marketRes, sentimentRes] = await Promise.all([
        api.get('/market/overview'),
        api.get('/market/sentiment')
      ])
      setMarketData(marketRes.data)
      setSentiment(sentimentRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data')
    }
  }

  const loadTicker = async () => {
    try {
      const { data } = await api.get('/market/ticker')
      if (data.data && data.data.length > 0) {
        setTickerData(data.data)
      } else {
        // Fallback: use marketData to build ticker
        const fallback = Object.values(marketData.data || {}).map((coin: any) => ({
          symbol: coin.symbol,
          price: coin.price,
          change24h: coin.change24h,
          image: coin.image
        }))
        setTickerData(fallback)
      }
    } catch (error) {
      console.error('Failed to load ticker, using fallback')
      // Fallback: use marketData to build ticker
      const fallback = Object.values(marketData.data || {}).map((coin: any) => ({
        symbol: coin.symbol,
        price: coin.price,
        change24h: coin.change24h,
        image: coin.image
      }))
      setTickerData(fallback)
    }
  }

  const coins = Object.entries(marketData.data || {}).map(([symbol, data]: [string, any]) => ({
    symbol,
    ...data
  }))

  const handleCoinClick = (symbol: string) => {
    setSelectedCoin(symbol)
  }

  const handleTickerCoinClick = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTickerCoinMenu({ symbol, x: rect.left, y: rect.bottom + 5 })
  }

  const getExchangeUrl = (symbol: string, exchange: string): string => {
    const urls: { [key: string]: string } = {
      binance: `https://www.binance.com/en/trade/${symbol}_USDT`,
      bybit: `https://www.bybit.com/trade/usdt/${symbol}USDT`,
      okx: `https://www.okx.com/trade-spot/${symbol}-USDT`,
      kucoin: `https://www.kucoin.com/trade/${symbol}-USDT`,
      coinbase: `https://exchange.coinbase.com/trade/${symbol}-USD`,
    }
    return urls[exchange] || '#'
  }

  const getBirdeyeUrl = (symbol: string): string => {
    const coin = marketData.data[symbol]
    if (coin?.id) {
      return `https://birdeye.so/token/${coin.id}?chain=solana`
    }
    return `https://birdeye.so/search/${symbol}?chain=solana`
  }

  const getDexScreenerUrl = (symbol: string): string => {
    return `https://dexscreener.com/search?q=${symbol}`
  }

  const getCoinGeckoUrl = (symbol: string): string => {
    const coin = marketData.data[symbol]
    if (coin?.id) {
      return `https://www.coingecko.com/en/coins/${coin.id}`
    }
    return `https://www.coingecko.com/en/coins/${symbol.toLowerCase()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neon-cyan animate-pulse">Loading market data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Crypto Ticker Bar */}
      <div className="glass rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700/50">
          <TrendingUp size={16} className="text-neon-cyan" />
          <span className="text-xs font-semibold text-neon-cyan uppercase tracking-wider">Live Market</span>
        </div>
        <div className="relative h-12 overflow-hidden">
          <motion.div
            className="flex items-center gap-8 absolute whitespace-nowrap"
            animate={{ x: [0, -1000] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {[...tickerData, ...tickerData, ...tickerData].map((coin, idx) => (
              <button
                key={`${coin.symbol}-${idx}`}
                onClick={(e) => handleTickerCoinClick(coin.symbol, e)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-colors cursor-pointer"
              >
                <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
                <span className="font-semibold text-sm">{coin.symbol}</span>
                <span className="text-sm">${coin.price.toLocaleString()}</span>
                <span className={`text-xs font-semibold ${coin.change24h >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
              </button>
            ))}
          </motion.div>

          {/* Ticker Coin Menu */}
          {tickerCoinMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setTickerCoinMenu(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="fixed z-50 glass rounded-xl p-2 min-w-[200px] shadow-2xl"
                style={{
                  left: Math.min(tickerCoinMenu.x, window.innerWidth - 220),
                  top: tickerCoinMenu.y
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700/50 mb-2">
                  <img
                    src={marketData.data[tickerCoinMenu.symbol]?.image}
                    alt={tickerCoinMenu.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-bold">{tickerCoinMenu.symbol}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">Buy on Exchange</div>
                  <a
                    href={getExchangeUrl(tickerCoinMenu.symbol, 'binance')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTickerCoinMenu(null)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-yellow-500/20 rounded-lg transition-colors text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="text-sm text-yellow-400">Binance</span>
                  </a>
                  <a
                    href={getExchangeUrl(tickerCoinMenu.symbol, 'bybit')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTickerCoinMenu(null)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-orange-500/20 rounded-lg transition-colors text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span className="text-sm text-orange-400">Bybit</span>
                  </a>
                  <a
                    href={getExchangeUrl(tickerCoinMenu.symbol, 'okx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTickerCoinMenu(null)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-500/20 rounded-lg transition-colors text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-sm text-blue-400">OKX</span>
                  </a>
                  <a
                    href={getExchangeUrl(tickerCoinMenu.symbol, 'kucoin')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTickerCoinMenu(null)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-500/20 rounded-lg transition-colors text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-sm text-green-400">KuCoin</span>
                  </a>

                  <div className="border-t border-gray-700/50 my-2 pt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">Analytics</div>
                    <a
                      href={getBirdeyeUrl(tickerCoinMenu.symbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setTickerCoinMenu(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neon-cyan/20 rounded-lg transition-colors text-left"
                    >
                      <span className="w-2 h-2 rounded-full bg-neon-cyan"></span>
                      <span className="text-sm text-neon-cyan">Birdeye.so</span>
                      <span className="text-xs text-gray-500 ml-auto">Solana</span>
                    </a>
                    <a
                      href={getDexScreenerUrl(tickerCoinMenu.symbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setTickerCoinMenu(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-500/20 rounded-lg transition-colors text-left"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      <span className="text-sm text-green-400">DexScreener</span>
                    </a>
                    <a
                      href={getCoinGeckoUrl(tickerCoinMenu.symbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setTickerCoinMenu(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-teal-500/20 rounded-lg transition-colors text-left"
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                      <span className="text-sm text-teal-400">CoinGecko</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
      {/* Lifetime Deal Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-neon-purple via-pink-500 to-neon-purple rounded-xl p-4 mb-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg p-2">
              <span className="text-2xl font-black text-white">60% OFF</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Lifetime Access Deal</h3>
              <p className="text-white/80 text-sm">Pay once, get everything forever. Limited time offer!</p>
            </div>
          </div>
          <Link
            to="/billing"
            className="px-6 py-3 bg-white text-neon-purple rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
          >
            Get Lifetime £199 →
          </Link>
        </div>
      </motion.div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Market Overview</h1>
          <p className="text-gray-400 mt-1">Real-time crypto intelligence</p>
        </div>
        <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-hover rounded-xl p-6 cursor-pointer hover:bg-dark-700/30 transition-colors group"
          onClick={() => setSentimentModalOpen(true)}
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-neon-cyan" size={24} />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">SENTIMENT</span>
              <Info className="w-3 h-3 text-gray-500 group-hover:text-neon-cyan transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-bold capitalize">{sentiment.overall || 'Neutral'}</div>
          <div className="text-sm text-gray-400 mt-1">Market Phase: {sentiment.marketPhase}</div>
          <div className="text-xs text-neon-cyan mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click for details</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass glass-hover rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Zap className="text-neon-purple" size={24} />
            <span className="text-xs text-gray-500 flex items-center gap-1">
              FEAR & GREED
              <span className="text-[10px] text-neon-purple/70">(click for info)</span>
            </span>
          </div>
          <FearGreedGauge
            value={sentiment.fearGreedIndex || 50}
            classification={sentiment.fearGreedClassification || 'Neutral'}
            onClick={() => setFearGreedModalOpen(true)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass glass-hover rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-neon-green" size={24} />
            <span className="text-xs text-gray-500">TOP GAINERS</span>
          </div>
          <div className="space-y-2">
            {marketData.topGainers?.slice(0, 3).map((coin: any) => (
              <div key={coin.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
                  <span className="text-sm font-medium">{coin.symbol}</span>
                </div>
                <span className="text-sm text-neon-green font-semibold">+{coin.change24h.toFixed(2)}%</span>
              </div>
            ))}
            {(!marketData.topGainers || marketData.topGainers.length === 0) && (
              <div className="text-sm text-gray-500">No gainers today</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass glass-hover rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="text-red-400" size={24} />
            <span className="text-xs text-gray-500">TOP LOSERS</span>
          </div>
          <div className="space-y-2">
            {marketData.topLosers?.slice(0, 3).map((coin: any) => (
              <div key={coin.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
                  <span className="text-sm font-medium">{coin.symbol}</span>
                </div>
                <span className="text-sm text-red-400 font-semibold">{coin.change24h.toFixed(2)}%</span>
              </div>
            ))}
            {(!marketData.topLosers || marketData.topLosers.length === 0) && (
              <div className="text-sm text-gray-500">No losers today</div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Assets */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Top Assets</h2>
          <div className="space-y-4">
            {coins.slice(0, 6).map((coin, index) => (
              <motion.div
                key={coin.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCoinClick(coin.symbol)}
                className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg hover:bg-dark-600/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={coin.image}
                    alt={coin.symbol}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/40?text=${coin.symbol}`
                    }}
                  />
                  <div>
                    <div className="font-semibold">{coin.name} ({coin.symbol})</div>
                    <div className="text-sm text-gray-500">
                      Vol: ${(coin.volume / 1e9).toFixed(2)}B | MC: ${(coin.marketCap / 1e9).toFixed(2)}B
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold">${coin.price.toLocaleString()}</div>
                  <div className={`text-sm font-semibold ${coin.change24h >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trending Coins */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Trending Now</h2>
          <div className="space-y-4">
            {sentiment.trendingCoins?.map((symbol: string, index: number) => {
              const coin = marketData.data?.[symbol]
              if (!coin) return null
              return (
                <motion.div
                  key={symbol}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCoinClick(coin.symbol)}
                className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg hover:bg-dark-600/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neon-cyan/20 text-neon-cyan font-bold text-sm">
                      {index + 1}
                    </div>
                    <img
                      src={coin.image}
                      alt={symbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/40?text=${symbol}`
                      }}
                    />
                    <div>
                      <div className="font-semibold">{coin.name} ({symbol})</div>
                      <div className="text-sm text-gray-500">
                        24h Change: {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold">${coin.price.toLocaleString()}</div>
                    <div className={`text-sm font-semibold ${coin.change24h >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                      {coin.change24h >= 0 ? '↗' : '↘'} {Math.abs(coin.change24h).toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Last Updated */}
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              <span>Last updated: {new Date(marketData.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Chart Modal */}
      <AnimatePresence>
        {selectedCoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCoin(null)}
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
                  {marketData.data[selectedCoin]?.image && (
                    <img
                      src={marketData.data[selectedCoin].image}
                      alt={selectedCoin}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {marketData.data[selectedCoin]?.name || selectedCoin} ({selectedCoin})
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xl text-neon-cyan">
                        ${marketData.data[selectedCoin]?.price?.toLocaleString()}
                      </span>
                      <span className={`text-sm ${marketData.data[selectedCoin]?.change24h >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {marketData.data[selectedCoin]?.change24h >= 0 ? '+' : ''}
                        {marketData.data[selectedCoin]?.change24h?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCoin(null)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* TradingView Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-neon-cyan" />
                    Price Chart
                  </h3>
                  <div className="h-[400px] w-full">
                    <TradingViewChart symbol={selectedCoin} theme="dark" />
                  </div>
                </div>

                {/* Exchange Links */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink size={20} className="text-neon-cyan" />
                    Trade {selectedCoin}
                  </h3>
                  <ExchangeLinks symbol={selectedCoin} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentiment Modal */}
      <AnimatePresence>
        {sentimentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSentimentModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full border border-neon-cyan/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="text-neon-cyan" size={24} />
                  <h2 className="text-xl font-bold">Market Sentiment Analysis</h2>
                </div>
                <button
                  onClick={() => setSentimentModalOpen(false)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-dark-700/50 rounded-xl border border-neon-cyan/20">
                  <div className="text-sm text-gray-400 mb-1">Current Sentiment</div>
                  <div className={`text-3xl font-bold capitalize ${
                    sentiment.overall === 'bullish' ? 'text-neon-green' :
                    sentiment.overall === 'bearish' ? 'text-red-400' : 'text-neon-yellow'
                  }`}>
                    {sentiment.overall || 'Neutral'}
                  </div>
                </div>

                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <div className="text-sm text-gray-400 mb-2">Why is the market {sentiment.overall || 'neutral'}?</div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {sentiment.description || sentiment.overall === 'bullish'
                      ? `The market is showing bullish momentum with strong buying pressure. Key indicators include rising trading volumes, positive funding rates, and a fear & greed index moving toward greed. This often signals that institutions are accumulating positions.`
                      : sentiment.overall === 'bearish'
                        ? `The market is displaying bearish characteristics with selling pressure dominating. Indicators show decreasing volumes, negative funding rates, and fear driving retail decisions. This typically indicates a risk-off environment where caution is advised.`
                        : `The market is in a neutral consolidation phase with mixed signals. Neither bulls nor bears have clear control, suggesting a potential accumulation or distribution period before the next significant move.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-dark-700/30 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Market Phase</div>
                    <div className="text-lg font-semibold text-neon-cyan">{sentiment.marketPhase || 'Accumulation'}</div>
                  </div>
                  <div className="p-3 bg-dark-700/30 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Fear & Greed</div>
                    <div className="text-lg font-semibold text-neon-purple">{sentiment.fearGreedIndex || 50}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-center pt-2">
                  Data refreshes every 30 seconds
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fear & Greed Analytics Modal */}
      <AnimatePresence>
        {fearGreedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setFearGreedModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-lg w-full border border-neon-purple/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="text-neon-purple" size={24} />
                  <h2 className="text-xl font-bold">Fear & Greed Index</h2>
                </div>
                <button
                  onClick={() => setFearGreedModalOpen(false)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Current Value */}
                <div className="p-4 bg-dark-700/50 rounded-xl border border-neon-purple/20 text-center">
                  <div className="text-sm text-gray-400 mb-2">Current Index Value</div>
                  <div className={`text-5xl font-bold mb-2 ${
                    (sentiment.fearGreedIndex || 50) <= 20 ? 'text-red-500' :
                    (sentiment.fearGreedIndex || 50) <= 40 ? 'text-orange-500' :
                    (sentiment.fearGreedIndex || 50) <= 60 ? 'text-yellow-400' :
                    (sentiment.fearGreedIndex || 50) <= 80 ? 'text-green-400' : 'text-emerald-400'
                  }`}>
                    {sentiment.fearGreedIndex || 50}
                  </div>
                  <div className={`text-lg font-semibold ${
                    (sentiment.fearGreedIndex || 50) <= 20 ? 'text-red-500' :
                    (sentiment.fearGreedIndex || 50) <= 40 ? 'text-orange-500' :
                    (sentiment.fearGreedIndex || 50) <= 60 ? 'text-yellow-400' :
                    (sentiment.fearGreedIndex || 50) <= 80 ? 'text-green-400' : 'text-emerald-400'
                  }`}>
                    {sentiment.fearGreedClassification || 'Neutral'}
                  </div>
                </div>

                {/* Scale Explanation */}
                <div className="p-4 bg-dark-700/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Index Scale</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-gray-400"><strong className="text-red-500">0-20:</strong> Extreme Fear - Market may be oversold, potential buying opportunity</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-gray-400"><strong className="text-orange-500">21-40:</strong> Fear - Investors are worried, caution advised</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span className="text-gray-400"><strong className="text-yellow-400">41-60:</strong> Neutral - Market is balanced, wait for direction</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="text-gray-400"><strong className="text-green-400">61-80:</strong> Greed - Optimism is high, consider taking profits</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      <span className="text-gray-400"><strong className="text-emerald-400">81-100:</strong> Extreme Greed - Market may be overbought, bubble risk</span>
                    </div>
                  </div>
                </div>

                {/* How It's Calculated */}
                <div className="p-4 bg-dark-700/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">How It's Calculated</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    The Fear & Greed Index analyzes multiple market indicators including volatility, market momentum, social media sentiment, Bitcoin dominance, and Google search trends. It helps identify when investors are becoming too greedy (bullish) or too fearful (bearish).
                  </p>
                </div>

                {/* Trading Implications */}
                <div className="p-4 bg-dark-700/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Trading Implications</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-neon-green">•</span>
                      <span><strong className="text-gray-300">Extreme Fear (0-20):</strong> Often signals a bottom. Consider accumulating quality assets.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-neon-yellow">•</span>
                      <span><strong className="text-gray-300">Neutral (41-60):</strong> Wait for a breakout in either direction before making large moves.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span><strong className="text-gray-300">Extreme Greed (81-100):</strong> Market may be due for correction. Consider taking profits.</span>
                    </li>
                  </ul>
                </div>

                <div className="text-xs text-gray-500 text-center pt-2">
                  Data sourced from alternative.me • Updates daily
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
