import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, CheckCircle, Plus, X } from 'lucide-react'
import api from '../../lib/api'

export default function MobileBilling() {
  const [currentPlan] = useState<'Starter' | 'Active Trader' | 'Alpha Access'>('Starter')
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'card', last4: '4242', expiry: '12/25', default: true }
  ])
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '' })

  const prices = {
    Starter: { USD: '$0', GBP: '£0' },
    'Active Trader': { USD: '$29', GBP: '£23' },
    'Alpha Access': { USD: '$299', GBP: '£235', originalUSD: '$499', originalGBP: '£393' }
  }

  const getPrice = (plan: string) => {
    if (plan === 'Starter' || plan === 'Active Trader' || plan === 'Alpha Access') {
      return prices[plan][currency]
    }
    return plan
  }

  const plans = [
    {
      name: 'Starter',
      price: prices['Starter'][currency],
      period: 'Free Forever',
      features: ['2 Live Setups', '1 Signal/Day', 'Basic Charts', 'Public Watchlist'],
      popular: false
    },
    {
      name: 'Active Trader',
      price: prices['Active Trader'][currency],
      period: '/month',
      features: ['6 Trade Setups', 'Unlimited Signals', '3 Alpha Picks/Day', 'Telegram Alerts', 'Advanced Analytics'],
      popular: true
    },
    {
      name: 'Alpha Access',
      price: prices['Alpha Access'][currency],
      originalPrice: prices['Alpha Access'][currency === 'GBP' ? 'originalGBP' : 'originalUSD'],
      period: 'One-Time',
      discount: '40% OFF',
      features: ['All 12 Setups', 'Unlimited Alpha', 'VIP Dashboard', 'Lifetime Access', 'Direct Support'],
      popular: false,
      elite: true
    }
  ]

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
    try {
      const response = await api.post('/subscription/create-checkout-session', {
        plan: planNameToId[planName],
        currency: currency.toLowerCase(),
      })
      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch {
      setSelectedPlan(planName)
      setShowPaymentModal(true)
    }
  }

  const handleAddCard = () => {
    if (newCard.number.length < 16 || newCard.expiry.length < 5) return
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
    setPaymentMethods(paymentMethods.map(c => ({ ...c, default: c.id === id })))
  }

  return (
    <div className="h-full flex flex-col bg-dark-950">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-800 bg-dark-900">
        <Crown size={24} className="text-trading-gold" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Billing</h1>
          <p className="text-xs text-gray-400">Manage your subscription</p>
        </div>
        {/* Currency Toggle */}
        <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
          <button
            onClick={() => setCurrency('GBP')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              currency === 'GBP' ? 'bg-trading-cyan text-dark-950' : 'text-gray-400'
            }`}
          >
            £
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              currency === 'USD' ? 'bg-trading-cyan text-dark-950' : 'text-gray-400'
            }`}
          >
            $
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Current Plan */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-trading-gold/20 to-trading-cyan/20 rounded-2xl p-4 border border-trading-gold/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Current Plan</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentPlan === 'Starter'
                  ? 'bg-gray-500/20 text-gray-400'
                  : currentPlan === 'Active Trader'
                    ? 'bg-trading-cyan/20 text-trading-cyan'
                    : 'bg-trading-gold/20 text-trading-gold'
              }`}>
                {currentPlan}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{getPrice(currentPlan)}</span>
              {currentPlan === 'Active Trader' && <span className="text-sm text-gray-400">/mo</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {currentPlan === 'Starter' ? 'Free Forever' : currentPlan === 'Active Trader' ? 'Monthly billing' : 'Lifetime access'}
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="px-4 pb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Upgrade</h2>
          <div className="space-y-3">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-dark-900 rounded-2xl border p-4 ${
                  plan.elite
                    ? 'border-trading-gold/50'
                    : plan.popular
                      ? 'border-trading-plasma/50'
                      : 'border-dark-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    {plan.discount && (
                      <span className="text-xs text-trading-gold font-semibold">{plan.discount}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {plan.originalPrice && (
                      <div className="text-xs text-gray-500 line-through">{getPrice(plan.originalPrice)}</div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${plan.elite ? 'text-trading-gold' : 'text-white'}`}>
                        {plan.price}
                      </span>
                      <span className="text-xs text-gray-400">{plan.period}</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={14} className={plan.elite ? 'text-trading-gold' : 'text-trading-profit'} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={currentPlan === plan.name}
                  className={`w-full py-3 rounded-xl font-bold text-sm ${
                    plan.elite
                      ? 'bg-gradient-to-r from-trading-gold to-orange-500 text-dark-950'
                      : plan.popular
                        ? 'bg-gradient-to-r from-trading-plasma to-purple-500 text-white'
                        : currentPlan === plan.name
                          ? 'bg-dark-800 text-gray-500 cursor-not-allowed'
                          : 'bg-dark-800 text-white border border-dark-700'
                  }`}
                >
                  {currentPlan === plan.name ? 'Current Plan' : plan.name === 'Starter' ? 'Free' : 'Upgrade'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Methods</h2>
          <div className="space-y-3">
            {paymentMethods.map((card) => (
              <div key={card.id} className="bg-dark-900 rounded-2xl p-4 border border-dark-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
                  <div>
                    <p className="font-medium text-sm text-white">•••• {card.last4}</p>
                    <p className="text-xs text-gray-400">Exp {card.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {card.default && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-trading-profit/20 text-trading-profit">Default</span>
                  )}
                  {!card.default && (
                    <button onClick={() => handleSetDefault(card.id)} className="text-xs text-gray-400">Set Default</button>
                  )}
                  {paymentMethods.length > 1 && (
                    <button onClick={() => handleRemoveCard(card.id)} className="p-2">
                      <X size={16} className="text-trading-loss" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {showAddCard ? (
              <div className="bg-dark-900 rounded-2xl p-4 border border-dark-800 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Card Number</label>
                  <input
                    type="text"
                    value={newCard.number}
                    onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-trading-cyan"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Expiry</label>
                    <input
                      type="text"
                      value={newCard.expiry}
                      onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                      placeholder="MM/YY"
                      className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-trading-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">CVV</label>
                    <input
                      type="text"
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                      placeholder="123"
                      className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-trading-cyan"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddCard}
                    className="flex-1 bg-trading-cyan text-dark-950 font-bold py-3 rounded-xl text-sm"
                  >
                    Add Card
                  </button>
                  <button 
                    onClick={() => setShowAddCard(false)}
                    className="flex-1 bg-dark-800 text-white font-bold py-3 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowAddCard(true)}
                className="w-full bg-dark-900 border border-dark-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={18} />
                Add Payment Method
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end z-50">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-dark-900 rounded-t-3xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Confirm Upgrade</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="bg-dark-800 rounded-2xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Plan</span>
                <span className="font-bold">{selectedPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="font-bold text-trading-cyan">
                  {selectedPlan === 'Active Trader' ? (currency === 'GBP' ? '£23/mo' : '$29/mo') : selectedPlan === 'Alpha Access' ? (currency === 'GBP' ? '£235' : '$299') : 'Free'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="w-full bg-gradient-to-r from-trading-cyan to-trading-blue text-dark-950 font-bold py-4 rounded-xl"
            >
              Continue to Payment
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
