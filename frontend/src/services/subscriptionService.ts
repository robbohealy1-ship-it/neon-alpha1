import api from '../lib/api';

export interface SubscriptionStatus {
  isActive: boolean;
  plan: 'free' | 'basic' | 'pro' | 'lifetime';
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

class SubscriptionService {
  private cache: SubscriptionStatus | null = null;
  private cacheTime: number = 0;
  private cacheExpiry: number = 60000; // 1 minute cache

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    // Return cached data if still valid
    if (this.cache && Date.now() - this.cacheTime < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await api.get('/subscription/status');
      console.log('[Subscription] API response data:', JSON.stringify(response.data));
      this.cache = response.data;
      this.cacheTime = Date.now();
      return response.data;
    } catch (error: any) {
      console.error('[Subscription] API error:', error?.response?.status, error?.response?.data || error?.message);
      // Default to free tier on error
      return {
        isActive: false,
        plan: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }
  }

  async createCheckoutSession(plan: 'free' | 'basic' | 'pro'): Promise<{ url: string }> {
    const response = await api.post('/subscription/create-checkout-session', { plan });
    return response.data;
  }

  async createPortalSession(): Promise<{ url: string }> {
    const response = await api.post('/subscription/create-portal-session');
    return response.data;
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }

  // Check if user can access premium features
  async canAccessPremium(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.plan !== 'free'; // All non-free plans have premium access
  }

  // Check if user can use Telegram alerts (Pro plan only)
  async canUseTelegramAlerts(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.plan === 'pro'; // Only PRO can use Telegram
  }
}

export const subscriptionService = new SubscriptionService();
