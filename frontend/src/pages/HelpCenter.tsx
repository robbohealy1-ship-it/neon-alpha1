import { motion } from 'framer-motion'
import { HelpCircle, Book, MessageCircle, Mail, Search } from 'lucide-react'
import { useState } from 'react'

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')

  const faqs = [
    {
      question: 'How do I add assets to my watchlist?',
      answer: 'Go to the Watchlist page and click "Add Asset". Search for the cryptocurrency you want to track (e.g., BTC, ETH, SOL) by symbol or name. Click "Add" to include it in your watchlist. Your watchlist is automatically saved to localStorage and will persist across browser sessions. You can also set sentiment indicators (Bullish/Bearish/Neutral) for each asset to track your market outlook.'
    },
    {
      question: 'How do trade setups work?',
      answer: 'Trade setups are algorithmically generated based on technical analysis including Exponential Moving Averages (EMA), Relative Strength Index (RSI), trading volume, and support/resistance levels. The system analyzes market conditions to identify potential trading opportunities with entry zones, stop loss levels, and multiple take profit targets (TP1, TP2, TP3). Each setup includes risk assessment (LOW/MEDIUM/HIGH) and confidence score. Visit the Setups page to view current opportunities, filter by status/direction, click any setup to see the professional TradingView chart with trade levels overlay showing Entry, SL, and TP zones.'
    },
    {
      question: 'How do I use the TradingView chart on Setups and Signals?',
      answer: 'When you click a trade setup or signal, you\'ll see a professional TradingView chart with all the tools you need: MACD, RSI, Bollinger Bands, Moving Averages, and more. The chart includes a trade levels overlay showing your Entry zone (cyan), Stop Loss (red), and Take Profit targets (green). Click "Full Chart (All Tools)" to open TradingView.com with the full professional toolkit including drawing tools for trend lines, Fibonacci retracements, and long/short position boxes. You can also click the TradingView logo on any chart to go directly to that coin\'s chart.'
    },
    {
      question: 'How do I track my portfolio performance?',
      answer: 'Use the Journal (Portfolio Tracker) to log your cryptocurrency trades. Enter the asset symbol, direction (Long/Short), entry price, exit price, position size, and notes. The system automatically calculates your P&L (Profit & Loss) in USD and percentage, tracks your win rate, and provides performance analytics. You can mark trades as "Open" or "Closed" to track active positions versus completed trades. Export your trade history as CSV for tax reporting and analysis.'
    },
    {
      question: 'What risk levels are recommended for trading?',
      answer: 'Neon Alpha recommends a 1% risk per trade as optimal for crypto swing trading. The platform uses three risk tiers: Conservative (0.5%), Optimal (1%), and Aggressive (2%). Risk is calculated based on the distance from entry to stop loss. GREEN indicates LOW risk (<1.5%), CYAN indicates MEDIUM/optimal risk (1.5%-3%), and RED indicates HIGH risk (>3%). Always use proper position sizing and never risk more than you can afford to lose.'
    },
    {
      question: 'What do the sentiment indicators mean?',
      answer: 'Sentiment indicators reflect your market outlook for specific cryptocurrencies: Bullish (green) indicates you expect the price to rise, Bearish (red) indicates you expect the price to fall, and Neutral (gray) indicates no strong directional bias. You can set these indicators on watchlist items to track your trading thesis and compare against market movements over time.'
    },
    {
      question: 'How often is market data updated?',
      answer: 'Cryptocurrency market data is refreshed every 15 seconds to provide near real-time pricing information. This includes current prices, 24-hour price changes, volume data, and market cap. The Fear & Greed Index updates every minute to reflect overall market sentiment. All data is sourced from multiple exchanges to ensure accuracy.'
    },
    {
      question: 'How are support and resistance levels calculated?',
      answer: 'Support and resistance levels are calculated based on recent price action and volatility. Support represents a price level where buying interest is historically strong, potentially preventing further price declines. Resistance represents a price level where selling pressure is historically strong, potentially preventing further price increases. These levels are displayed in trade setups to help you identify optimal entry and exit points.'
    },
    {
      question: 'What cryptocurrencies are supported?',
      answer: 'Neon Alpha supports tracking and trading for major cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Avalanche (AVAX), Polygon (MATIC), Chainlink (LINK), Cardano (ADA), Polkadot (DOT), Dogecoin (DOGE), XRP, Litecoin (LTC), and many others. The platform continuously adds support for new cryptocurrencies based on market demand and liquidity.'
    },
    {
      question: 'How do I interpret the Fear & Greed Index?',
      answer: 'The Fear & Greed Index measures market sentiment on a scale from 0 to 100. Values below 25 indicate "Extreme Fear" (potential buying opportunity), 25-45 indicate "Fear", 45-55 indicate "Neutral", 55-75 indicate "Greed", and above 75 indicate "Extreme Greed" (potential selling opportunity). This index helps you understand whether the market is driven by fear or greed, which can inform contrarian trading strategies.'
    },
    {
      question: 'How do I upgrade my account tier?',
      answer: 'Visit the Billing page to view available subscription plans. Free tier includes basic features like limited trade setups and standard market data. Premium tiers offer advanced analytics, unlimited trade setups, real-time alerts, priority support, and access to exclusive trading strategies. Payment can be made via credit card or cryptocurrency.'
    },
    {
      question: 'Is my trading data secure?',
      answer: 'Yes, your trading data is encrypted and stored securely. We use industry-standard encryption for data transmission and storage. You can enable Two-Factor Authentication (2FA) in the Security settings for an additional layer of protection. API keys can be generated for programmatic access and can be revoked at any time from the Security page.'
    },
    {
      question: 'Can I export my trade history?',
      answer: 'Currently, trade history is stored locally in your browser. We are working on adding export functionality (CSV format) to allow you to download your complete trade history for tax reporting and analysis purposes. This feature will be available in an upcoming update.'
    },
    {
      question: 'How do price alerts work?',
      answer: 'Price alerts notify you when a cryptocurrency reaches your target price. You can set alerts from the Watchlist page by clicking on an asset and specifying your target price. When the price crosses your target, you will receive an in-app notification. Alerts can be enabled/disabled in Settings under the Notifications section.'
    },
    {
      question: 'How can I use API keys?',
      answer: 'API keys let you connect Neon Alpha with your favorite trading tools and platforms. Use them with: TradingView (custom indicators), Python trading bots (CCXT, custom scripts), Excel/Google Sheets (live price feeds), portfolio tracking apps (Delta, CoinTracker), or automated trading strategies. Simply generate a key from Security settings and paste it into your chosen platform. Your key gives you access to real-time market data, trade setups, and portfolio management. Keep it secret and revoke anytime from Security.'
    },
    {
      question: 'How do Signals work?',
      answer: 'The Neon Signal Engine scans 30+ cryptocurrencies across multiple timeframes (1h, 4h, 1d) using three proprietary strategies: EMA Trend Pullback, Breakout Setup, and RSI Divergence. Each signal includes Entry price, Stop Loss, Take Profit targets (TP1, TP2, TP3), Risk:Reward ratio, and Confidence score (60-95%). Click any signal to view a full TradingView professional chart with trade levels overlay, or click the "TradingView" button to open the chart directly. You can also copy trade text or send alerts to Telegram.'
    },
    {
      question: 'What is the Confidence score in Signals?',
      answer: 'The Confidence score (60-95%) indicates the probability of a successful trade based on multiple factors: trend strength (EMA alignment), volume confirmation, RSI positioning, and historical backtesting of the specific strategy. Higher confidence signals (80%+) have better historical performance. However, all trading carries risk - use proper position sizing and never risk more than you can afford to lose. The Confidence score helps you prioritize which signals to act on first.'
    },
    {
      question: 'How do I read the Signal and Setup cards?',
      answer: 'Each card displays: Coin logo (real crypto logo from CoinGecko), Symbol (e.g., BTC), Timeframe (1h/4h/1d), Direction (Long/Short), Strategy name, Confidence percentage with visual bar, Entry zone, Stop Loss, TP1/TP2/TP3 targets, and R:R Ratio. Cards include quick links to TradingView, Binance, Bybit, and OKX. Click "Trade" or the card itself to view the full analysis with TradingView chart showing your trade levels overlay. The Trade Plan tab shows position sizing recommendations.'
    },
    {
      question: 'Can I export my trade history?',
      answer: 'Yes! Go to the Journal/Portfolio page and click the export button to download your complete trade history as a CSV file. This includes all trade details (symbol, direction, entry/exit prices, P&L, dates) for tax reporting and performance analysis in Excel or Google Sheets.'
    },
    {
      question: 'What tools are available on the TradingView charts?',
      answer: 'The embedded TradingView charts include: MACD, RSI, Bollinger Bands, Moving Averages, volume analysis, date range selector, economic calendar, hotlist, and news headlines. For the full professional toolkit with 100+ indicators, drawing tools (trend lines, Fibonacci, position boxes), alerts, and strategy tester - click "Full Chart (All Tools)" to open TradingView.com. Your analysis and drawings can be saved to your TradingView account.'
    }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 overflow-y-auto pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-1 sm:mb-2">Help Center</h1>
        <p className="text-sm sm:text-base text-gray-400">Find answers to common questions</p>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 sm:p-6"
      >
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-700 border border-gray-700 rounded-lg pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-neon-cyan transition-colors"
          />
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        <a 
          href="https://docs.neonalpha.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass glass-hover rounded-xl p-4 sm:p-6 cursor-pointer"
        >
          <Book className="text-neon-cyan mb-2 sm:mb-3" size={24} />
          <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Documentation</h3>
          <p className="text-xs sm:text-sm text-gray-400">Comprehensive guides and tutorials</p>
        </a>
        <a 
          href="https://discord.gg/neonalpha" 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass glass-hover rounded-xl p-4 sm:p-6 cursor-pointer"
        >
          <MessageCircle className="text-neon-cyan mb-2 sm:mb-3" size={24} />
          <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Discord Community</h3>
          <p className="text-xs sm:text-sm text-gray-400">Join 10,000+ traders in our Discord</p>
        </a>
        <a 
          href="mailto:support@neonalpha.com" 
          className="glass glass-hover rounded-xl p-4 sm:p-6 cursor-pointer sm:col-span-2 lg:col-span-1"
        >
          <Mail className="text-neon-cyan mb-2 sm:mb-3" size={24} />
          <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Email Support</h3>
          <p className="text-xs sm:text-sm text-gray-400">support@neonalpha.com</p>
        </a>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <HelpCircle className="text-neon-cyan" size={20} />
          <h2 className="text-lg sm:text-xl font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="border border-gray-800 rounded-lg overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-dark-700 transition-colors">
                  <span className="font-medium text-sm sm:text-base pr-2">{faq.question}</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 text-gray-400 text-sm sm:text-base leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
