import { useSubscription } from '../hooks/useSubscription';

// ============================================================================
// TIER DEFINITIONS - Match backend exactly
// ============================================================================

export type Tier = 'free' | 'starter' | 'basic' | 'pro' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trialing' | 'inactive' | 'error';

export interface UserSubscription {
  plan: Tier | undefined;
  status: SubscriptionStatus | undefined;
  isActive: boolean;
  signalsViewedToday?: number;
  alphaPicksViewedToday?: number;
  subscriptionExpiry?: string | null;
}

// ============================================================================
// FEATURE CONFIGURATION - Mirror of backend FEATURE_ACCESS
// ============================================================================

export const FEATURE_ACCESS = {
  free: [
    'dashboard',
    'market_overview',
    'help_center',
  ],
  starter: [
    'dashboard',
    'signals_limited',
    'market_overview',
    'basic_charts',
    'public_watchlist',
    'help_center',
  ],
  basic: [
    'dashboard',
    'signals_limited',
    'market_overview',
    'basic_charts',
    'public_watchlist',
    'help_center',
  ],
  pro: [
    'dashboard',
    'signals_unlimited',
    'alpha_picks_limited',
    'strategies_all',
    'real_time_alerts',
    'advanced_analytics',
    'risk_management',
    'telegram_alerts',
    'email_alerts',
    'websocket_feed',
    'portfolio_analytics',
    'trade_journal',
    'custom_watchlists',
    'backtesting_basic',
  ],
  lifetime: [
    'dashboard',
    'signals_unlimited',
    'alpha_picks_unlimited',
    'strategies_all',
    'real_time_alerts',
    'advanced_analytics',
    'risk_management',
    'telegram_alerts',
    'email_alerts',
    'websocket_feed',
    'portfolio_analytics',
    'trade_journal',
    'custom_watchlists',
    'backtesting_advanced',
    'vip_dashboard',
    'priority_processing',
    'beta_features',
    'exclusive_signals',
    'direct_support',
  ]
} as const;

export type Feature = 
  | 'dashboard'
  | 'signals_limited'
  | 'signals_unlimited'
  | 'alpha_picks_limited'
  | 'alpha_picks_unlimited'
  | 'strategies_all'
  | 'real_time_alerts'
  | 'advanced_analytics'
  | 'risk_management'
  | 'telegram_alerts'
  | 'email_alerts'
  | 'websocket_feed'
  | 'market_overview'
  | 'basic_charts'
  | 'portfolio_analytics'
  | 'trade_journal'
  | 'custom_watchlists'
  | 'public_watchlist'
  | 'backtesting_basic'
  | 'backtesting_advanced'
  | 'vip_dashboard'
  | 'priority_processing'
  | 'beta_features'
  | 'exclusive_signals'
  | 'help_center'
  | 'direct_support';

// ============================================================================
// STRATEGY ACCESS CONFIG - Mirror of backend STRATEGY_ACCESS
// ============================================================================

export const STRATEGY_ACCESS = {
  'ema_trend_pullback': { tier: 'basic', enabled: true },
  'liquidity_sweep_long': { tier: 'pro', enabled: true },
  'liquidity_sweep_short': { tier: 'pro', enabled: true },
  'range_breakout': { tier: 'pro', enabled: true },
  'rsi_divergence': { tier: 'pro', enabled: true },
  'volume_spike': { tier: 'pro', enabled: true },
  'market_structure_shift': { tier: 'lifetime', enabled: true },
  'fair_value_gap': { tier: 'lifetime', enabled: true },
  'liquidity_structure_combo': { tier: 'lifetime', enabled: true },
  'trend_continuation': { tier: 'lifetime', enabled: true },
  'institutional_levels': { tier: 'lifetime', enabled: true },
} as const;

export type StrategyId = keyof typeof STRATEGY_ACCESS;

// ============================================================================
// USAGE LIMITS - Mirror of backend USAGE_LIMITS
// ============================================================================

export const USAGE_LIMITS = {
  free: {
    signalsPerDay: 0,
    alphaPicksPerDay: 0,
    watchlists: 0,
    alerts: 0,
    backtestsPerDay: 0,
    tradeSetups: 0,
    setupsRefreshHours: 24,
  },
  starter: {
    signalsPerDay: 1,
    alphaPicksPerDay: 0,
    watchlists: 1,
    alerts: 0,
    backtestsPerDay: 0,
    tradeSetups: 2,        // Starter: 2 setups
    setupsRefreshHours: 24, // Refreshes daily
  },
  basic: {
    signalsPerDay: 1,
    alphaPicksPerDay: 0,
    watchlists: 1,
    alerts: 0,
    backtestsPerDay: 0,
    tradeSetups: 2,        // Basic: 2 setups (same as starter)
    setupsRefreshHours: 24, // Refreshes daily
  },
  pro: {
    signalsPerDay: -1, // unlimited
    alphaPicksPerDay: 3,
    watchlists: 10,
    alerts: 50,
    backtestsPerDay: 10,
    tradeSetups: 6,        // Active Trader: 6 setups
    setupsRefreshHours: 6, // Refreshes every 6 hours
  },
  lifetime: {
    signalsPerDay: -1,
    alphaPicksPerDay: -1,
    watchlists: -1,
    alerts: -1,
    backtestsPerDay: -1,
    tradeSetups: 12,       // Alpha: All setups
    setupsRefreshHours: 4,  // Refreshes every 4 hours
  }
} as const;

// ============================================================================
// CORE PERMISSION FUNCTIONS
// ============================================================================

/**
 * Check if user can access a specific feature
 */
export function canAccess(
  subscription: UserSubscription,
  feature: Feature
): { allowed: boolean; reason?: string; upgradeTier?: Tier } {
  const { plan, isActive } = subscription;
  
  if (!isActive || !plan) {
    return { allowed: false, reason: 'Subscription required', upgradeTier: 'basic' };
  }
  
  // Check subscription expiry
  if (subscription.subscriptionExpiry) {
    const expiry = new Date(subscription.subscriptionExpiry);
    if (expiry < new Date()) {
      return { allowed: false, reason: 'Subscription expired', upgradeTier: plan };
    }
  }
  
  // Get features for tier (including inherited ones)
  const features = getFeaturesForTier(plan);
  
  if (features.includes(feature)) {
    return { allowed: true };
  }
  
  // Determine required tier
  const requiredTier = findRequiredTier(feature);
  return {
    allowed: false,
    reason: requiredTier 
      ? `Upgrade to ${requiredTier.toUpperCase()} to access this feature`
      : 'Feature not available',
    upgradeTier: requiredTier || 'pro'
  };
}

/**
 * Check if user can access a specific strategy
 */
export function canAccessStrategy(
  subscription: UserSubscription,
  strategyId: StrategyId
): { allowed: boolean; reason?: string; upgradeTier?: Tier } {
  const { plan, isActive } = subscription;
  
  if (!isActive || !plan) {
    return { allowed: false, reason: 'Subscription required', upgradeTier: 'basic' };
  }
  
  const strategy = STRATEGY_ACCESS[strategyId];
  
  if (!strategy || !strategy.enabled) {
    return { allowed: false, reason: 'Strategy not available' };
  }
  
  const tierHierarchy: Tier[] = ['starter', 'basic', 'pro', 'lifetime'];
  const userTierIndex = tierHierarchy.indexOf(plan);
  const requiredTierIndex = tierHierarchy.indexOf(strategy.tier);
  
  if (userTierIndex >= requiredTierIndex) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `Upgrade to ${strategy.tier.toUpperCase()} to access this strategy`,
    upgradeTier: strategy.tier
  };
}

/**
 * Check usage limits
 */
export function checkUsageLimit(
  subscription: UserSubscription,
  resource: keyof typeof USAGE_LIMITS.free
): { allowed: boolean; limit: number; remaining: number; current: number } {
  const { plan, isActive } = subscription;
  
  if (!isActive || !plan) {
    return { allowed: false, limit: 0, remaining: 0, current: 0 };
  }
  
  const limits = USAGE_LIMITS[plan];
  const limit = limits ? limits[resource] : 0;
  
  // For now, track usage locally via the subscription object if available
  // In production, this should come from the backend
  const current = resource === 'signalsPerDay' 
    ? (subscription.signalsViewedToday || 0)
    : (subscription.alphaPicksViewedToday || 0);
  
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1, current };
  }
  
  const remaining = Math.max(0, limit - current);
  return {
    allowed: current < limit,
    limit,
    remaining,
    current
  };
}

// ============================================================================
// TIER CHECK FUNCTIONS
// ============================================================================

export function isBasicTier(subscription: UserSubscription): boolean {
  const { plan, isActive } = subscription;
  return isActive && plan === 'basic';
}

export function isProTier(subscription: UserSubscription): boolean {
  const { plan, isActive } = subscription;
  return isActive && plan === 'pro';
}

export function isLifetimeTier(subscription: UserSubscription): boolean {
  const { plan, isActive } = subscription;
  return isActive && plan === 'lifetime';
}

export function isProOrLifetime(subscription: UserSubscription): boolean {
  const { plan, isActive } = subscription;
  return isActive && (plan === 'pro' || plan === 'lifetime');
}

export function isExpired(subscription: UserSubscription): boolean {
  if (!subscription.subscriptionExpiry) return false;
  return new Date(subscription.subscriptionExpiry) < new Date();
}

// ============================================================================
// FEATURE-SPECIFIC CHECKS (Convenience functions)
// ============================================================================

export function canViewAllSignals(subscription: UserSubscription): boolean {
  return canAccess(subscription, 'signals_unlimited').allowed;
}

export function canViewAlphaPicks(subscription: UserSubscription): boolean {
  return canAccess(subscription, 'alpha_picks_limited').allowed ||
         canAccess(subscription, 'alpha_picks_unlimited').allowed;
}

export function canViewAllStrategies(subscription: UserSubscription): boolean {
  return canAccess(subscription, 'strategies_all').allowed;
}

export function canViewAdvancedAnalytics(subscription: UserSubscription): boolean {
  return canAccess(subscription, 'advanced_analytics').allowed;
}

export function canUseTelegram(subscription: UserSubscription): boolean {
  return canAccess(subscription, 'telegram_alerts').allowed;
}

export function canAccessVIPDashboard(subscription: UserSubscription): boolean {
  return canAccess(subscription, 'vip_dashboard').allowed;
}

export function canAccessBetaFeatures(subscription: UserSubscription): boolean {
  return canAccess(subscription, 'beta_features').allowed;
}

export function getSignalLimit(subscription: UserSubscription): number {
  const { plan, isActive } = subscription;
  if (!isActive || !plan) return 0;
  const limits = USAGE_LIMITS[plan];
  return limits ? limits.signalsPerDay : 0;
}

export function getAlphaPickLimit(subscription: UserSubscription): number {
  const { plan, isActive } = subscription;
  if (!isActive || !plan) return 0;
  const limits = USAGE_LIMITS[plan];
  return limits ? limits.alphaPicksPerDay : 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFeaturesForTier(tier: Tier): Feature[] {
  switch (tier) {
    case 'lifetime':
      return [...FEATURE_ACCESS.free, ...FEATURE_ACCESS.starter, ...FEATURE_ACCESS.basic, ...FEATURE_ACCESS.pro, ...FEATURE_ACCESS.lifetime];
    case 'pro':
      return [...FEATURE_ACCESS.free, ...FEATURE_ACCESS.starter, ...FEATURE_ACCESS.basic, ...FEATURE_ACCESS.pro];
    case 'basic':
      return [...FEATURE_ACCESS.free, ...FEATURE_ACCESS.starter, ...FEATURE_ACCESS.basic];
    case 'starter':
      return [...FEATURE_ACCESS.free, ...FEATURE_ACCESS.starter];
    case 'free':
    default:
      return [...FEATURE_ACCESS.free];
  }
}

function findRequiredTier(feature: Feature): Tier | null {
  for (const [tier, features] of Object.entries(FEATURE_ACCESS)) {
    if (features.includes(feature as any)) {
      return tier as Tier;
    }
  }
  return null;
}

export function getStrategiesForTier(tier: Tier): StrategyId[] {
  const tierHierarchy: Tier[] = ['starter', 'basic', 'pro', 'lifetime'];
  const userTierIndex = tierHierarchy.indexOf(tier);
  
  return Object.entries(STRATEGY_ACCESS)
    .filter(([_, config]) => {
      const strategyTierIndex = tierHierarchy.indexOf(config.tier);
      return config.enabled && userTierIndex >= strategyTierIndex;
    })
    .map(([id]) => id as StrategyId);
}

// ============================================================================
// TIER COMPARISON DATA (for UI display)
// ============================================================================

export const TIER_COMPARISON = {
  basic: {
    name: 'BASIC',
    price: 'Free',
    description: 'Essential market access for beginners',
    features: [
      { name: 'Dashboard Access', included: true },
      { name: 'Limited Signals (1/day)', included: true },
      { name: 'Market Overview', included: true },
      { name: 'Basic Charts', included: true },
      { name: 'Public Watchlist', included: true },
      { name: 'Alpha Picks', included: false },
      { name: 'All Strategies', included: false },
      { name: 'Real-time Alerts', included: false },
      { name: 'Advanced Analytics', included: false },
      { name: 'VIP Dashboard', included: false },
    ]
  },
  pro: {
    name: 'PRO',
    price: '$29/month',
    description: 'Full trading utility for active traders',
    features: [
      { name: 'Everything in BASIC', included: true },
      { name: 'Unlimited Signals', included: true },
      { name: 'Alpha Picks (3/day)', included: true },
      { name: 'All Trading Strategies', included: true },
      { name: 'Real-time Alerts', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Risk Management Tools', included: true },
      { name: 'Email/Telegram Alerts', included: true },
      { name: 'Backtesting (10/day)', included: true },
      { name: 'VIP Dashboard', included: false },
    ]
  },
  lifetime: {
    name: 'LIFETIME',
    price: '$299 one-time',
    description: 'Elite tier with exclusive access forever',
    features: [
      { name: 'Everything in PRO', included: true },
      { name: 'Unlimited Alpha Picks', included: true },
      { name: 'Early Access to New Features', included: true },
      { name: 'Priority Signal Generation', included: true },
      { name: 'Exclusive VIP Dashboard', included: true },
      { name: 'VIP-Level Instant Alerts', included: true },
      { name: 'Beta/Experimental Models', included: true },
      { name: 'Advanced Backtesting', included: true },
      { name: 'Direct Support Access', included: true },
      { name: 'Never Pay Again', included: true },
    ]
  }
} as const;

// ============================================================================
// REACT HOOK
// ============================================================================

export function useAccessControl() {
  const { subscription, plan, status } = useSubscription();
  
  const subscriptionData: UserSubscription = {
    plan: plan as Tier | undefined,
    status: status as SubscriptionStatus | undefined,
    isActive: status === 'active' || status === 'trialing',
    subscriptionExpiry: subscription?.currentPeriodEnd
  };

  const usageStatus = {
    signals: checkUsageLimit(subscriptionData, 'signalsPerDay'),
    alphaPicks: checkUsageLimit(subscriptionData, 'alphaPicksPerDay'),
    watchlists: checkUsageLimit(subscriptionData, 'watchlists'),
    alerts: checkUsageLimit(subscriptionData, 'alerts'),
    backtests: checkUsageLimit(subscriptionData, 'backtestsPerDay'),
  };

  return {
    // Subscription info
    ...subscriptionData,
    
    // Tier checks
    isBasicTier: isBasicTier(subscriptionData),
    isProTier: isProTier(subscriptionData),
    isLifetimeTier: isLifetimeTier(subscriptionData),
    isProOrLifetime: isProOrLifetime(subscriptionData),
    isExpired: isExpired(subscriptionData),
    isFreeTier: plan === 'free' || !subscriptionData.isActive,
    
    // Usage tracking
    usageStatus,
    
    // Feature access
    canViewAllSignals: canViewAllSignals(subscriptionData),
    canViewAlphaPicks: canViewAlphaPicks(subscriptionData),
    canViewAllStrategies: canViewAllStrategies(subscriptionData),
    canViewAdvancedAnalytics: canViewAdvancedAnalytics(subscriptionData),
    canUseTelegram: canUseTelegram(subscriptionData),
    canAccessVIPDashboard: canAccessVIPDashboard(subscriptionData),
    canAccessBetaFeatures: canAccessBetaFeatures(subscriptionData),
    
    // Limits
    getSignalLimit: getSignalLimit(subscriptionData),
    getAlphaPickLimit: getAlphaPickLimit(subscriptionData),
    
    // Core permission function
    canAccess: (feature: Feature) => canAccess(subscriptionData, feature),
    canAccessStrategy: (strategyId: StrategyId) => canAccessStrategy(subscriptionData, strategyId),
    checkUsageLimit: (resource: keyof typeof USAGE_LIMITS.free) => checkUsageLimit(subscriptionData, resource),
    
    // Available strategies (filter out 'free' before passing to getStrategiesForTier)
    availableStrategies: plan && plan !== 'free' ? getStrategiesForTier(plan as Tier) : [],
    
    // Tier comparison data
    tierComparison: TIER_COMPARISON
  };
}

