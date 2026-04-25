import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Book, MessageCircle, Mail, Search, ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I add assets to my watchlist?',
    answer: 'Go to the Watchlist page and tap "Add Asset". Search for the cryptocurrency by symbol or name (e.g., BTC, ETH, SOL). Tap "Add" to include it. Your watchlist is automatically saved and persists across sessions.'
  },
  {
    question: 'How do trade setups work?',
    answer: 'Trade setups are algorithmically generated based on technical analysis including EMA, RSI, volume, and support/resistance levels. Each setup includes entry zones, stop loss, and multiple take profit targets with risk assessment.'
  },
  {
    question: 'How do I use the TradingView chart?',
    answer: 'Tap any setup or signal card to view the professional TradingView chart with trade levels overlay (Entry, SL, TP). Tap "Full Chart" to open TradingView.com with the complete toolkit including drawing tools.'
  },
  {
    question: 'How do I track my portfolio?',
    answer: 'Use the Journal (Portfolio Tracker) to log your trades. Enter the asset, direction, entry price, exit price, and position size. The system automatically calculates P&L and tracks your win rate.'
  },
  {
    question: 'What risk levels are recommended?',
    answer: 'Neon Alpha recommends 1% risk per trade. Green = LOW risk (<1.5%), Cyan = MEDIUM (1.5%-3%), Red = HIGH (>3%). Never risk more than you can afford to lose.'
  },
  {
    question: 'How often is market data updated?',
    answer: 'Cryptocurrency market data refreshes every 15 seconds. The Fear & Greed Index updates every minute. All data is sourced from multiple exchanges for accuracy.'
  },
  {
    question: 'What cryptocurrencies are supported?',
    answer: 'Major cryptocurrencies including BTC, ETH, SOL, AVAX, MATIC, LINK, ADA, DOT, DOGE, XRP, LTC, and many others. New coins are added based on market demand.'
  },
  {
    question: 'How do I upgrade my account?',
    answer: 'Tap Billing in the menu to view plans. Active Trader (£23/mo) includes 6 setups and unlimited signals. Alpha Access (£235 one-time) unlocks all 12 setups and lifetime access.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted and stored securely. Enable Two-Factor Authentication in Security settings for extra protection. API keys can be generated and revoked anytime.'
  },
  {
    question: 'How do Signals work?',
    answer: 'The Signal Engine scans 30+ cryptocurrencies across multiple timeframes using EMA Trend Pullback, Breakout Setup, and RSI Divergence strategies. Each signal includes Entry, SL, TP targets, and Confidence score.'
  },
  {
    question: 'How do I read Signal cards?',
    answer: 'Each card shows: Coin logo, Symbol, Timeframe, Direction (Long/Short), Strategy, Confidence %, Entry zone, Stop Loss, and TP targets. Tap a card for the full TradingView chart.'
  },
  {
    question: 'Can I export trade history?',
    answer: 'Yes! Go to Journal and tap the export button to download your complete trade history as CSV for tax reporting and analysis.'
  },
]

export default function MobileHelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-dark-950">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-800 bg-dark-900">
        <HelpCircle size={24} className="text-trading-cyan" />
        <div>
          <h1 className="text-lg font-bold text-white">Help Center</h1>
          <p className="text-xs text-gray-400">Find answers & get support</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-trading-cyan transition-colors"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-3 gap-2">
          <a 
            href="https://docs.neonalpha.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-dark-900 rounded-xl p-3 border border-dark-800 flex flex-col items-center gap-1 active:bg-dark-800"
          >
            <Book size={20} className="text-trading-cyan" />
            <span className="text-xs text-gray-300">Docs</span>
          </a>
          <a 
            href="https://discord.gg/neonalpha" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-dark-900 rounded-xl p-3 border border-dark-800 flex flex-col items-center gap-1 active:bg-dark-800"
          >
            <MessageCircle size={20} className="text-trading-plasma" />
            <span className="text-xs text-gray-300">Discord</span>
          </a>
          <a 
            href="mailto:support@neonalpha.com" 
            className="bg-dark-900 rounded-xl p-3 border border-dark-800 flex flex-col items-center gap-1 active:bg-dark-800"
          >
            <Mail size={20} className="text-trading-gold" />
            <span className="text-xs text-gray-300">Email</span>
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-2">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="bg-dark-900 rounded-2xl border border-dark-800 overflow-hidden">
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left active:bg-dark-800 transition-colors"
              >
                <span className="font-medium text-sm text-white pr-4">{faq.question}</span>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-400 flex-shrink-0 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`} 
                />
              </button>
              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-dark-800 pt-3">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8">
            <Search size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No results found</p>
            <p className="text-gray-500 text-xs">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
