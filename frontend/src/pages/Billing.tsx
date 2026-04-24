import { motion } from 'framer-motion'
import { CreditCard, Crown, Zap, CheckCircle, Plus, Bitcoin, X, PoundSterling, DollarSign } from 'lucide-react'
import { useState } from 'react'
import api from '../lib/api'

export default function Billing() {
  const [currentPlan, _setCurrentPlan] = useState<'Starter' | 'Active Trader' | 'Alpha Access'>('Starter')
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'card', last4: '4242', expiry: '12/25', default: true }
  ])
  const [billingHistory, _setBillingHistory] = useState<any[]>([])
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '' })
  const [_loading, _setLoading] = useState(false)

  // Fixed prices for each currency
  const prices = {
    Starter: { USD: '$0', GBP: '£0' },
    'Active Trader': { USD: '$29', GBP: '£23' },
    'Alpha Access': { USD: '$299', GBP: '£235', originalUSD: '$499', originalGBP: '£393' }
  }

  const getPrice = (planOrPrice: 'Starter' | 'Active Trader' | 'Alpha Access' | string) => {
    if (planOrPrice === 'Starter' || planOrPrice === 'Active Trader' || planOrPrice === 'Alpha Access') {
      return prices[planOrPrice][currency]
    }
    // If it's a price string like '$499' or '£393', return as-is
    return planOrPrice
  }

  const plans = [
    {
      name: 'Starter',
      gbpPrice: 0,
      price: prices['Starter'][currency],
      period: ' Free Forever',
      features: [
        '2 Live Trade Setups (daily refresh)',
        '1 Signal Per Day',
        'Market Overview',
        'Basic Charts',
        'Public Watchlist',
        'Community Discord'
      ],
      notIncluded: ['Alpha Picks Research', 'Telegram Alerts', 'Advanced Strategies'],
      popular: false
    },
    {
      name: 'Active Trader',
      gbpPrice: 23,
      price: prices['Active Trader'][currency],
      period: '/month',
      features: [
        '6 Trade Setups (refreshes every 6h)',
        'Unlimited Signals (100+ coins)',
        '3 Alpha Picks Per Day',
        'All Strategies Unlocked',
        'Telegram Instant Alerts',
        'Email Notifications',
        'Advanced Analytics',
        'Risk Management Tools',
        '10 Backtests/Day'
      ],
      notIncluded: ['VIP Alpha Dashboard', 'All 12 Setups (Alpha)'],
      popular: true
    },
    {
      name: 'Alpha Access',
      gbpPrice: 235,
      originalPrice: prices['Alpha Access'].originalGBP,
      price: prices['Alpha Access'][currency],
      period: ' One-Time',
      discount: '40% OFF — Early Bird',
      features: [
        'All 12 Trade Setups (4h refresh)',
        'Unlimited Alpha Picks',
        'VIP Alpha Dashboard',
        'Institutional Strategies',
        'VIP Instant Alerts',
        'Advanced Backtesting',
        'Early Beta Access',
        'Direct Support',
        'Lifetime Updates'
      ],
      popular: false,
      elite: true
    }
  ]

  // Map display names to backend plan IDs
  const planNameToId: Record<string, string> = {
    'Starter': 'starter',
    'Active Trader': 'pro',
    'Alpha Access': 'lifetime'
  }

  const handleUpgrade = async (planName: string) => {
    if (planName === 'Starter') {
      window.location.href = '/signals'
      return
    }
    _setLoading(true)

    try {
      // Create Stripe checkout session with selected currency
      const response = await api.post('/subscription/create-checkout-session', {
        plan: planNameToId[planName] || planName.toLowerCase(),
        currency: currency.toLowerCase(), // Send currency preference to backend
      })
      
      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (err) {
      console.error('Error creating checkout:', err)
      // Fallback to modal if API fails
      setSelectedPlan(planName)
      setShowPaymentModal(true)
    } finally {
      _setLoading(false)
    }
  }

  const handlePayment = () => {
    // Redirect to payment terminal (Stripe checkout)
    const planId = planNameToId[selectedPlan] || selectedPlan.toLowerCase()
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${planId === 'pro' ? 'pro' : 'enterprise'}`
    window.open(checkoutUrl, '_blank')
    setShowPaymentModal(false)
  }

  const handleAddCard = () => {
    if (newCard.number.length < 16 || newCard.expiry.length < 5) {
      return
    }
    
    const card = {
      id: Date.now(),
      type: 'card',
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      default: false
    }
    setPaymentMethods([...paymentMethods, card])
    setNewCard({ number: '', expiry: '', cvv: '' })
    setShowAddCard(false)
  }

  const handleRemoveCard = (id: number) => {
    setPaymentMethods(paymentMethods.filter(c => c.id !== id))
  }

  const handleSetDefault = (id: number) => {
    setPaymentMethods(paymentMethods.map(c => ({
      ...c,
      default: c.id === id
    })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Billing</h1>
          <p className="text-gray-400">Manage your subscription and payment methods</p>
        </div>
        
        {/* Currency Toggle */}
        <div className="flex items-center gap-2 bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setCurrency('GBP')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              currency === 'GBP' 
                ? 'bg-neon-cyan text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PoundSterling size={16} />
            GBP
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              currency === 'USD' 
                ? 'bg-neon-cyan text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign size={16} />
            USD
          </button>
        </div>
      </div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className="text-neon-cyan" size={24} />
            <h2 className="text-xl font-semibold">Current Plan</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            currentPlan === 'Starter'
              ? 'bg-gray-500/20 text-gray-400'
              : currentPlan === 'Active Trader'
                ? 'bg-neon-cyan/10 text-neon-cyan'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-dark-900'
          }`}>
            {currentPlan}
          </span>
        </div>
        <div className="p-4 bg-dark-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xl font-bold">
              {getPrice(currentPlan)}
              {currentPlan === 'Active Trader' && <span className="text-sm text-gray-400">/month</span>}
              {currentPlan === 'Alpha Access' && <span className="text-sm text-gray-400"> one-time</span>}
            </p>
            <p className="text-sm text-gray-400">
              {currentPlan === 'Starter' ? 'Free Forever' : currentPlan === 'Active Trader' ? `Billed monthly in ${currency}` : 'Lifetime Access'}
            </p>
          </div>
          <p className="text-sm text-gray-400">
            {currentPlan === 'Starter' ? 'No billing required' : currentPlan === 'Active Trader' ? `Your next billing date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}` : 'Permanent access - never expires'}
          </p>
        </div>
      </motion.div>

      {/* Pricing Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
              className={`glass rounded-xl p-6 relative ${
                plan.elite
                  ? 'border-2 border-yellow-400'
                  : plan.popular
                    ? 'border-2 border-neon-purple'
                    : ''
              } ${currentPlan === plan.name ? 'opacity-60' : ''}`}
            >
              {plan.elite && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-dark-900 text-xs font-semibold px-3 py-1 rounded-full">
                    ELITE
                  </span>
                </div>
              )}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-neon-purple to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                {plan.originalPrice && (
                  <div className="text-sm text-gray-500 line-through mb-1">
                    {getPrice(plan.originalPrice)}
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-3xl font-bold ${plan.elite ? 'text-yellow-400' : plan.popular ? 'text-neon-purple' : ''}`}>{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                {plan.discount && (
                  <div className="text-xs text-neon-yellow font-semibold mt-1">
                    {plan.discount} • Limited Time
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={plan.elite ? 'text-yellow-400' : 'text-neon-green'} size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {/* Not Included */}
              {plan.notIncluded && plan.notIncluded.length > 0 && (
                <div className="mb-4 pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-2">Not included:</p>
                  <ul className="space-y-1">
                    {plan.notIncluded.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <span>×</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => handleUpgrade(plan.name)}
                disabled={currentPlan === plan.name}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.elite
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-dark-900 hover:opacity-90'
                    : plan.popular
                      ? 'bg-gradient-to-r from-neon-purple to-pink-500 text-white hover:opacity-90 neon-glow'
                      : currentPlan === plan.name
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-dark-700 text-white hover:bg-dark-600 border border-gray-600 hover:border-neon-cyan/50'
                }`}
              >
                {currentPlan === plan.name ? 'Current Plan' : plan.name === 'Starter' ? 'Get Started Free' : plan.name === 'Alpha Access' ? 'Get Lifetime Access' : 'Upgrade'}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="text-neon-cyan" size={24} />
          <h2 className="text-xl font-semibold">Payment Methods</h2>
        </div>
        <div className="space-y-4">
          {paymentMethods.map((card) => (
            <div key={card.id} className="p-4 bg-dark-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                <div>
                  <p className="font-medium">•••• •••• •••• {card.last4}</p>
                  <p className="text-sm text-gray-400">Expires {card.expiry}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {card.default && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neon-green/10 text-neon-green">Default</span>
                )}
                {!card.default && (
                  <button 
                    onClick={() => handleSetDefault(card.id)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Set Default
                  </button>
                )}
                {paymentMethods.length > 1 && (
                  <button 
                    onClick={() => handleRemoveCard(card.id)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {showAddCard ? (
            <div className="p-4 bg-dark-700 rounded-lg space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Card Number</label>
                <input
                  type="text"
                  value={newCard.number}
                  onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-dark-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Expiry</label>
                  <input
                    type="text"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                    placeholder="MM/YY"
                    className="w-full bg-dark-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">CVV</label>
                  <input
                    type="text"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                    placeholder="123"
                    className="w-full bg-dark-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-cyan"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleAddCard}
                  className="flex-1 bg-neon-cyan text-dark-900 font-semibold py-2 rounded-lg hover:opacity-90"
                >
                  Add Card
                </button>
                <button 
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 bg-dark-600 text-white font-semibold py-2 rounded-lg hover:bg-dark-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAddCard(true)}
              className="w-full bg-dark-700 text-white font-semibold py-3 rounded-lg hover:bg-dark-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Payment Method
            </button>
          )}
        </div>
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-neon-cyan" size={24} />
          <h2 className="text-xl font-semibold">Billing History</h2>
        </div>
        <div className="space-y-3">
          {billingHistory.length === 0 ? (
            <p className="text-sm text-gray-400">No billing history available</p>
          ) : (
            billingHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div>
                  <p className="font-medium">{entry.plan} Plan</p>
                  <p className="text-sm text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{entry.amount}</p>
                  <span className="text-xs text-neon-green">{entry.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Upgrade to {selectedPlan}</h2>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Plan</span>
                  <span className="font-semibold">{selectedPlan}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-semibold">
                    {selectedPlan === 'Active Trader' 
                      ? (currency === 'GBP' ? '£23.00' : '$29.00')
                      : selectedPlan === 'Alpha Access'
                        ? (currency === 'GBP' ? '£235.00' : '$299.00')
                        : (currency === 'GBP' ? '£0.00' : '$0.00')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Billing</span>
                  <span className="font-semibold">
                    {selectedPlan === 'Active Trader' ? 'Monthly' : selectedPlan === 'Alpha Access' ? 'One-Time' : 'Free'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handlePayment}
                  className="w-full bg-gradient-animate text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity neon-glow"
                >
                  Pay with Card
                </button>
                <button 
                  onClick={handlePayment}
                  className="w-full bg-dark-700 text-white font-semibold py-3 rounded-lg hover:bg-dark-600 transition-colors flex items-center justify-center gap-2 neon-glow-purple"
                >
                  <Bitcoin size={20} />
                  Pay with Crypto
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Secure payment powered by Stripe. Cancel anytime.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
