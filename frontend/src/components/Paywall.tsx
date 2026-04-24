import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, Loader2, Check } from 'lucide-react';
import { subscriptionService, SubscriptionStatus } from '../services/subscriptionService';
import Pricing from '../pages/Pricing';

interface PaywallProps {
  children: React.ReactNode;
  requiredPlan?: 'pro';
  fallback?: React.ReactNode;
}

export default function Paywall({ children, requiredPlan, fallback }: PaywallProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscription(status);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
          <p className="text-gray-400">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Check access
  // Free tier has access to basic features
  // PRO subscription required for premium features (Telegram alerts)
  const hasAccess = requiredPlan === 'pro' 
    ? subscription?.plan === 'pro'
    : true; // All users (including free) can access basic features

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show pricing page
  if (showPricing || !fallback) {
    return <Pricing />;
  }

  // Show fallback (compact paywall)
  return (
    <div className="min-h-screen bg-dark-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="glass rounded-2xl p-8 text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-full bg-neon-purple/10 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-neon-purple" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-black text-gradient mb-4">
            Active Trader Feature
          </h2>
          <p className="text-gray-400 mb-8">
            Telegram alerts are available with Active Trader ($29/mo) and Alpha Access ($299 lifetime).
          </p>

          {/* Active Trader Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-700/50 border border-neon-purple/30 mb-8">
            <div className="w-12 h-12 rounded-lg bg-neon-purple/10 flex items-center justify-center">
              <Crown className="w-6 h-6 text-neon-purple" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Active Trader</div>
              <div className="text-xs text-gray-400">$29/month or $299 lifetime</div>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8 text-left max-w-md mx-auto">
            <li className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-neon-green" />
              Telegram Instant Alerts
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-neon-green" />
              Unlimited High-Confidence Setups
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-neon-green" />
              Advanced Technical Analysis
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-neon-green" />
              Full Signal History
            </li>
          </ul>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPricing(true)}
              className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-neon-purple to-pink-500 text-white hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Upgrade to Active
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {fallback && (
              <button
                onClick={() => window.history.back()}
                className="px-8 py-4 rounded-xl font-bold text-lg border border-gray-600 text-gray-400 hover:bg-dark-700 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
