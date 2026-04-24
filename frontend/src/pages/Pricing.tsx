import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles, Loader2, Lock, Bell, BarChart3, Target } from 'lucide-react';
import api from '../lib/api';

interface PricingPlan {
  id: 'starter' | 'pro' | 'lifetime';
  name: string;
  priceUSD: string;
  priceGBP: string;
  period: string;
  priceId: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  icon: typeof Zap;
  color: string;
  popular?: boolean;
  elite?: boolean;
  originalPriceUSD?: string;
  originalPriceGBP?: string;
  discount?: string;
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceUSD: '$0',
    priceGBP: '£0',
    period: 'Free Forever',
    priceId: 'price_starter',
    description: 'Get a taste of alpha. Perfect for testing the waters.',
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    features: [
      '2 Live Trade Setups (daily refresh)',
      '1 Signal Per Day',
      'Market Overview',
      'Basic Charts',
      'Public Watchlist',
      'Community Discord',
    ],
    notIncluded: [
      'Alpha Picks',
      'Research Reports',
      'Telegram Alerts',
      'Advanced Strategies',
    ],
  },
  {
    id: 'pro',
    name: 'Active Trader',
    priceUSD: '$29',
    priceGBP: '£23',
    period: '/month',
    priceId: 'price_pro',
    description: 'For serious traders building a real portfolio.',
    icon: Crown,
    color: 'from-neon-purple to-pink-500',
    popular: true,
    features: [
      '6 Trade Setups (refreshes every 6h)',
      'Unlimited Signals (100+ coins)',
      '3 Alpha Picks Per Day',
      'All Strategies Unlocked',
      'Telegram Instant Alerts',
      'Email Notifications',
      'Advanced Analytics',
      'Risk Management Tools',
      '10 Backtests/Day',
    ],
    notIncluded: [
      'VIP Alpha Dashboard',
      'All 12 Setups (Alpha Level)',
    ],
  },
  {
    id: 'lifetime',
    name: 'Alpha Access',
    priceUSD: '$299',
    priceGBP: '£235',
    originalPriceUSD: '$499',
    originalPriceGBP: '£393',
    period: 'One-Time',
    priceId: 'price_lifetime',
    description: 'Elite tier with exclusive access forever.',
    icon: Crown,
    color: 'from-neon-cyan to-yellow-400',
    elite: true,
    discount: '40% OFF – Early Bird • Limited Time',
    features: [
      'All 12 Trade Setups (4h refresh)',
      'Unlimited Alpha Picks',
      'VIP Alpha Dashboard',
      'Institutional Strategies',
      'VIP Instant Alerts',
      'Advanced Backtesting',
      'Early Beta Access',
      'Never Pay Again',
    ],
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'GBP'>('USD');

  const handleSubscribe = async (plan: PricingPlan) => {
    // STARTER tier - no checkout needed
    if (plan.id === 'starter') {
      // Redirect to signals page for free access
      window.location.href = '/signals';
      return;
    }

    setLoading(plan.id);
    setError(null);

    try {
      const response = await api.post('/subscription/create-checkout-session', {
        plan: plan.id,
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-800">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-purple/10 border border-neon-purple/30 mb-6">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              <span className="text-sm font-medium text-neon-purple">
                Unlock Full Access
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gradient mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              Professional-grade trade setups & signals. 
              From 2 daily setups (free) to 12 institutional-level opportunities (Alpha).
            </p>
            
            {/* Currency Toggle */}
            <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-dark-700/50 border border-gray-700">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currency === 'USD' 
                    ? 'bg-neon-purple text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('GBP')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currency === 'GBP' 
                    ? 'bg-neon-purple text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                GBP (£)
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl border ${
                plan.elite
                  ? 'border-yellow-400/50 shadow-2xl shadow-yellow-400/20'
                  : plan.popular
                  ? 'border-neon-purple/50 shadow-2xl shadow-neon-purple/20'
                  : 'border-gray-700'
              } bg-dark-700/50 backdrop-blur-sm overflow-hidden`}
            >
              {/* Elite Badge */}
              {plan.elite && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-dark-900 text-xs font-bold px-4 py-1 rounded-bl-lg">
                  BEST VALUE
                </div>
              )}
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-neon-purple to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {currency === 'USD' ? (
                    <>
                      {plan.originalPriceUSD && (
                        <div className="text-sm text-gray-500 line-through mb-1">
                          {plan.originalPriceUSD}
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${plan.elite ? 'text-yellow-400' : ''}`}>
                          {plan.priceUSD}
                        </span>
                        {plan.discount && (
                          <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-0.5 rounded">
                            {plan.discount}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {plan.originalPriceGBP && (
                        <div className="text-sm text-gray-500 line-through mb-1">
                          {plan.originalPriceGBP}
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${plan.elite ? 'text-yellow-400' : ''}`}>
                          {plan.priceGBP}
                        </span>
                        {plan.discount && (
                          <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-0.5 rounded">
                            {plan.discount}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Not Included */}
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <div className="mb-4 pt-4 border-t border-gray-700/50">
                    <p className="text-xs text-gray-500 mb-2">Not included:</p>
                    <ul className="space-y-1">
                      {plan.notIncluded.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                          <span className="mt-0.5">×</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                    plan.elite
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-dark-900 shadow-lg shadow-yellow-400/25'
                      : plan.popular
                      ? 'bg-gradient-to-r from-neon-purple to-pink-500 text-white shadow-lg shadow-neon-purple/25'
                      : 'bg-gradient-to-r from-neon-cyan to-blue-500 text-white'
                  } ${loading === plan.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : plan.id === 'starter' ? (
                    <>
                      <span>Start Free — No Credit Card</span>
                    </>
                  ) : plan.id === 'lifetime' ? (
                    <>
                      <span>Get Lifetime Access</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Upgrade to {plan.name.split(' ')[0]}
                    </>
                  )}
                </button>

                {/* Psychology Tag */}
                {plan.id === 'starter' && (
                  <p className="text-center text-xs text-gray-500 mt-3">
                    Limited to 2 setups. Upgrade for full access.
                  </p>
                )}
                {plan.id === 'pro' && (
                  <p className="text-center text-xs text-gray-500 mt-3">
                    {currency === 'GBP' ? '£0.76/day' : '$0.96/day'} — Less than a coffee for 6 daily setups
                  </p>
                )}
                {plan.id === 'lifetime' && (
                  <p className="text-center text-xs text-yellow-400/70 mt-3">
                    🔥 Early bird price — Regular price {currency === 'GBP' ? '£393' : '$499'}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          <div className="glass rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-neon-green" />
            </div>
            <h4 className="font-bold mb-2">Real-time Signals</h4>
            <p className="text-sm text-gray-400">
              Instant alerts when high-probability setups form
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-neon-yellow/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-neon-yellow" />
            </div>
            <h4 className="font-bold mb-2">High-Confidence Setups</h4>
            <p className="text-sm text-gray-400">
              Only the best setups with 70%+ confidence rating
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-neon-purple/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-neon-purple" />
            </div>
            <h4 className="font-bold mb-2">Telegram Alerts</h4>
            <p className="text-sm text-gray-400">
              Never miss an opportunity with instant notifications
            </p>
          </div>
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            30-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
        </motion.div>
      </div>
    </div>
  );
}
