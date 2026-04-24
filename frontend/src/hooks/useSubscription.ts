import { useState, useEffect, useCallback } from 'react';
import { subscriptionService, SubscriptionStatus } from '../services/subscriptionService';
import { useAuthStore } from '../store/authStore';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  const fetchSubscription = useCallback(async () => {
    // If not logged in, default to FREE tier without calling API
    if (!token) {
      setSubscription({
        isActive: false,
        plan: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscription(status);
    } catch (err) {
      setError('Failed to fetch subscription status');
      console.error(err);
      // Default to free tier on error
      setSubscription({
        isActive: false,
        plan: 'free',
        status: 'error',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refresh = useCallback(() => {
    subscriptionService.clearCache();
    return fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    fetchSubscription();
    
    // Refresh subscription status every 5 minutes (only if logged in)
    if (token) {
      const interval = setInterval(fetchSubscription, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchSubscription, token]);

  const canAccessPremium = subscription?.plan !== 'free'; // All non-free plans have premium access
  const canUseTelegram = subscription?.plan === 'pro' || subscription?.plan === 'lifetime'; // PRO and LIFETIME can use Telegram
  const plan = subscription?.plan || 'free'; // Default to 'free' if undefined
  const status = subscription?.status || 'inactive';

  return {
    subscription,
    loading,
    error,
    canAccessPremium,
    canUseTelegram,
    plan,
    status,
    refresh,
  };
}
