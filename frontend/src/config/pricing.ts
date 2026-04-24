// ============================================================================
// PRICING CONFIGURATION - Single Source of Truth
// ============================================================================

export const PRICING = {
  // Exchange rate (1 GBP = 1.27 USD)
  GBP_TO_USD: 1.27,
  
  // Plans with both currencies
  plans: {
    starter: {
      id: 'basic',
      name: 'Starter',
      priceUSD: 0,
      priceGBP: 0,
      period: 'Free Forever',
      description: 'Get a taste of alpha. Perfect for testing the waters.',
      features: [
        '2 Live Trade Setups (refreshes daily)',
        '1 Signal Per Day',
        'Market Overview Dashboard',
        'Basic Charts',
        'Public Watchlist',
        'Community Discord Access',
      ],
      notIncluded: [
        'Alpha Picks Research Reports',
        'Telegram Trade Alerts',
        'Advanced Strategies',
      ],
      setupsLimit: 2,
      setupsRefreshHours: 24,
      signalsPerDay: 1,
      alphaPicksPerDay: 0,
      backtestsPerDay: 0,
    },
    
    activeTrader: {
      id: 'pro',
      name: 'Active Trader',
      priceUSD: 29,
      priceGBP: 23,  // ~$29 in GBP
      period: '/month',
      description: 'For serious traders building a real portfolio.',
      popular: true,
      features: [
        '6 Trade Setups (refreshes every 6h)',
        'Unlimited Signals (100+ coins)',
        '3 Alpha Picks Per Day',
        'All Strategies Unlocked',
        'Telegram Instant Alerts',
        'Email Notifications',
        'Advanced Analytics Dashboard',
        'Risk Management Calculator',
        '10 Backtests/Day',
      ],
      notIncluded: [
        'VIP Alpha Dashboard',
        'All 12 Setups (Alpha Level)',
      ],
      setupsLimit: 6,
      setupsRefreshHours: 6,
      signalsPerDay: -1, // unlimited
      alphaPicksPerDay: 3,
      backtestsPerDay: 10,
    },
    
    alphaAccess: {
      id: 'lifetime',
      name: 'Alpha Access',
      // Marketing: Show higher original price with discount
      originalPriceUSD: 499,  // "Was $499"
      originalPriceGBP: 393, // "Was £393"
      priceUSD: 299,        // "Now $299"
      priceGBP: 235,        // "Now £235"
      discountPercent: 40,  // "Save 40%"
      period: 'One-Time • Limited Time',
      description: 'Own the edge forever. Full institutional-grade access.',
      elite: true,
      features: [
        'All 12 Trade Setups (refreshes every 4h)',
        'Unlimited Alpha Picks Research',
        'VIP Alpha Dashboard',
        'Institutional-Grade Strategies',
        'VIP Instant Alerts',
        'Advanced Backtesting Suite',
        'Early Beta Feature Access',
        'Direct Founder Support',
        'Lifetime Updates Included',
      ],
      setupsLimit: 12,
      setupsRefreshHours: 4,
      signalsPerDay: -1, // unlimited
      alphaPicksPerDay: -1, // unlimited
      backtestsPerDay: -1, // unlimited
    },
  },
} as const;

// Helper to get price in selected currency
export function getPrice(gbpPrice: number, currency: 'GBP' | 'USD' = 'GBP'): string {
  if (currency === 'GBP') return `£${gbpPrice}`;
  return `$${Math.round(gbpPrice * PRICING.GBP_TO_USD)}`;
}

// Helper to format price display
export function formatPrice(
  priceUSD: number, 
  priceGBP: number, 
  currency: 'GBP' | 'USD', 
  period: string = ''
): string {
  if (priceUSD === 0 && priceGBP === 0) {
    return currency === 'GBP' ? '£0 Free Forever' : '$0 Free Forever';
  }
  
  const price = currency === 'GBP' ? priceGBP : priceUSD;
  const symbol = currency === 'GBP' ? '£' : '$';
  
  if (period.includes('One-Time')) {
    return `${symbol}${price} One-Time`;
  }
  
  return `${symbol}${price}${period}`;
}

// Feature comparison for pricing tables
export const FEATURE_COMPARISON = {
  'Trade Setups': { starter: '2', activeTrader: '6', alphaAccess: '12' },
  'Setup Refresh': { starter: 'Every 24h', activeTrader: 'Every 6h', alphaAccess: 'Every 4h' },
  'Signals': { starter: '1/day', activeTrader: 'Unlimited', alphaAccess: 'Unlimited' },
  'Alpha Picks': { starter: '—', activeTrader: '3/day', alphaAccess: 'Unlimited' },
  'Telegram Alerts': { starter: '—', activeTrader: '✓', alphaAccess: '✓' },
  'Email Alerts': { starter: '—', activeTrader: '✓', alphaAccess: '✓' },
  'Strategies': { starter: 'Basic', activeTrader: 'All', alphaAccess: 'Institutional' },
  'Backtests': { starter: '—', activeTrader: '10/day', alphaAccess: 'Unlimited' },
  'VIP Dashboard': { starter: '—', activeTrader: '—', alphaAccess: '✓' },
  'Support': { starter: 'Community', activeTrader: 'Email', alphaAccess: 'Direct' },
} as const;

export type PlanId = keyof typeof PRICING.plans;
export type PlanConfig = typeof PRICING.plans[PlanId];
