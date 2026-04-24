import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { tradeSetupEngine, TradeSetup, getSignalTimeframe } from '../services/tradeSetupEngine';
import { setupSchedulerService, SCAN_INTERVALS } from '../services/setupSchedulerService';
import { getUserWithSubscription } from '../services/permissionService';
import { signalEngine } from '../services/signalEngine';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// In-memory cache for setups (in production, use Redis)
let setupsCache: TradeSetup[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes between refreshes
const MAX_CACHE_AGE = 15 * 60 * 1000; // Serve cached data up to 15 min old if API fails

// CoinGecko ID mapping
const COINGECKO_IDS: { [key: string]: string } = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
  'AVAX': 'avalanche-2', 'MATIC': 'polygon', 'LINK': 'chainlink',
  'ADA': 'cardano', 'DOT': 'polkadot', 'DOGE': 'dogecoin',
  'XRP': 'ripple', 'BNB': 'binancecoin', 'UNI': 'uniswap',
  'LTC': 'litecoin', 'BCH': 'bitcoin-cash', 'ETC': 'ethereum-classic',
  'FIL': 'filecoin', 'TRX': 'tron', 'NEAR': 'near',
  'APT': 'aptos', 'OP': 'optimism', 'ARB': 'arbitrum',
  'SUI': 'sui', 'TON': 'the-open-network', 'ICP': 'internet-computer',
  'PEPE': 'pepe', 'SHIB': 'shiba-inu', 'FET': 'fetch-ai',
  'RNDR': 'render-token', 'INJ': 'injective-protocol', 'TIA': 'celestia'
};

async function fetchCurrentPrices(): Promise<{ [symbol: string]: number }> {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        params: {
          vs_currency: 'usd',
          ids: Object.values(COINGECKO_IDS).join(','),
          order: 'market_cap_desc'
        },
        timeout: 10000
      }
    );
    
    const prices: { [symbol: string]: number } = {};
    response.data.forEach((coin: any) => {
      const symbol = Object.keys(COINGECKO_IDS).find(
        key => COINGECKO_IDS[key] === coin.id
      ) || coin.symbol.toUpperCase();
      prices[symbol] = coin.current_price;
    });
    
    return prices;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return {};
  }
}

function transformSetupForFrontend(setup: TradeSetup) {
  return {
    id: setup.id,
    coin: setup.symbol + 'USDT',
    symbol: setup.symbol,
    bias: setup.bias === 'bullish' ? 'Bullish' : 'Bearish',
    entryZone: { low: setup.entryZone.low, high: setup.entryZone.high },
    entryPrice: setup.entryPrice,
    invalidation: setup.stopLoss,
    stopLoss: setup.stopLoss,
    targets: setup.targets,
    confidence: setup.confidenceScore,
    status: setup.status.toUpperCase().replace('_', ' ') as 'FORMING' | 'NEAR TRIGGER' | 'TRIGGERED' | 'EXPIRED',
    strategy: setup.strategy.join(' + '),
    strategies: setup.strategy,
    timeframe: setup.timeframe,
    signalTimeframe: setup.signalTimeframe || getSignalTimeframe(setup.timeframe),
    riskRewardRatio: setup.riskRewardRatio,
    riskPercent: setup.riskPercent,
    riskLevel: setup.riskLevel,
    confluence: setup.confluence,
    analysis: setup.analysis,
    createdAt: setup.createdAt.toISOString(),
    expiresAt: setup.expiresAt.toISOString()
  };
}

router.use(authenticateToken);

// GET /api/setups - Get all trade setups with real-time status updates and tier-based filtering
router.get('/', async (req, res) => {
  try {
    // Always fetch current prices first to check if we need to regenerate
    const currentPrices = await fetchCurrentPrices();
    const now = Date.now();
    
    let usingCachedData = false;
    
    // FIX: Always check database first for existing active setups
    // This prevents entry zones from "floating" with current price
    if (setupsCache.length === 0 || now - lastCacheUpdate > MAX_CACHE_AGE) {
      console.log('[Setups] Loading setups from database (entry zones frozen)...');
      try {
        const dbSetups = await prisma.tradeSetup.findMany({
          where: { 
            active: true,
            expiresAt: { gt: new Date() } // Only non-expired setups
          },
          orderBy: { createdAt: 'desc' },
          take: 12
        });
        
        if (dbSetups.length > 0) {
          setupsCache = dbSetups.map(dbSetup => {
            try {
              const entryZone = JSON.parse(dbSetup.entryZone || '{"low": 0, "high": 0}');
              return {
                id: dbSetup.id,
                symbol: dbSetup.asset,
                bias: dbSetup.direction as 'bullish' | 'bearish',
                status: dbSetup.status as any,
                timeframe: dbSetup.timeframe as '1H' | '4H' | '1D',
                signalTimeframe: dbSetup.timeframe === '1H' ? '15m' : dbSetup.timeframe === '4H' ? '1h' : '4h',
                strategy: [dbSetup.strategyType || 'liquidity'],
                strategyType: dbSetup.strategyType as any,
                entryZone: entryZone,
                entryPrice: (entryZone.low + entryZone.high) / 2,
                stopLoss: dbSetup.stopLoss,
                targets: JSON.parse(dbSetup.targets || '[]'),
                riskRewardRatio: 2,
                riskPercent: 1,
                riskLevel: dbSetup.riskLevel as any,
                confidenceScore: dbSetup.confidence,
                confluence: [dbSetup.strategyType || 'liquidity'],
                analysis: {
                  marketStructure: dbSetup.reasoning || 'HTF setup active',
                  keyLevels: {
                    support: [entryZone.low],
                    resistance: [entryZone.high]
                  },
                  volumeProfile: 'Building',
                  trendAlignment: dbSetup.direction || 'bullish'
                },
                createdAt: dbSetup.createdAt,
                expiresAt: dbSetup.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
              };
            } catch (e) {
              console.error(`[Setups] Error parsing setup ${dbSetup.id}:`, e);
              return null;
            }
          }).filter(Boolean) as TradeSetup[];
          
          lastCacheUpdate = now;
          usingCachedData = true;
          console.log(`[Setups] Loaded ${setupsCache.length} setups from database (frozen entry zones)`);
        }
      } catch (dbError) {
        console.error('[Setups] Database error:', dbError);
      }
    }
    
    // Only generate new setups when severely depleted (< 3 active) AND at least 4 hours since last gen
    // This prevents phantom setups appearing on refresh - setups complete their natural lifecycle
    const MIN_SETUPS_BEFORE_REGEN = 3;
    const MIN_HOURS_BETWEEN_GENERATIONS = 4;
    const hoursSinceLastGen = (now - lastCacheUpdate) / (1000 * 60 * 60);
    const needNewSetups = setupsCache.length < MIN_SETUPS_BEFORE_REGEN && 
                          Object.keys(currentPrices).length > 0 &&
                          hoursSinceLastGen >= MIN_HOURS_BETWEEN_GENERATIONS;
    
    if (needNewSetups) {
      console.log(`[Setups] Only ${setupsCache.length} active setups remaining (threshold: ${MIN_SETUPS_BEFORE_REGEN}), generating fresh batch...`);
      
      // Generate new setups from live data
      const freshSetups = await tradeSetupEngine.generateSetups(12);
      
      if (freshSetups.length > 0) {
        // Persist new setups to database so they freeze
        await tradeSetupEngine.persistSetups(freshSetups);
        setupsCache = freshSetups;
        usingCachedData = false;
        lastCacheUpdate = now;
        console.log(`[Setups] Generated ${freshSetups.length} fresh setups and persisted to db`);
      } else {
        console.log('[Setups] CoinGecko rate-limited, keeping existing db setups');
        usingCachedData = true;
      }
    } else if (setupsCache.length < MIN_SETUPS_BEFORE_REGEN) {
      console.log(`[Setups] Only ${setupsCache.length} setups but waiting ${MIN_HOURS_BETWEEN_GENERATIONS}h before regeneration`);
    }

    // Update setup statuses based on current prices
    const updatedSetups = setupsCache.map(setup => {
      const currentPrice = currentPrices[setup.symbol];
      if (currentPrice) {
        setup.status = tradeSetupEngine.updateSetupStatus(setup, currentPrice);
      }
      return transformSetupForFrontend(setup);
    });

    // Handle expired setups - mark as inactive in DB so they don't reappear on refresh
    const expiredSetups = setupsCache.filter(s => s.status === 'expired');
    for (const setup of expiredSetups) {
      try {
        await prisma.tradeSetup.update({
          where: { id: setup.id },
          data: { active: false, status: 'expired' }
        });
        console.log(`[Setups] Marked ${setup.symbol} as expired in database (sent to history)`);
      } catch (err) {
        console.error(`[Setups] Failed to mark ${setup.symbol} as expired:`, err);
      }
    }
    // Remove expired from cache
    setupsCache = setupsCache.filter(s => s.status !== 'expired');

    // Generate signals for setups that just entered entry zone
    // CRITICAL: Update DB status to 'triggered' BEFORE calling signal engine
    // so the signal engine can find it with the correct status
    const triggeredSetups = [];
    for (const setup of setupsCache) {
      if (setup.status === 'triggered') {
        const currentPrice = currentPrices[setup.symbol];
        if (currentPrice) {
          try {
            // FIRST: Update DB status to triggered so signal engine can find it
            await prisma.tradeSetup.update({
              where: { id: setup.id },
              data: { status: 'triggered' }
            });
            console.log(`[Setups] Updated ${setup.symbol} status to triggered in DB`);
            
            // SECOND: Generate signal for this specific setup
            const signals = await signalEngine.generateSignalsFromSetups(setup.symbol, currentPrice);
            if (signals.length > 0) {
              console.log(`[Setups] Generated ${signals.length} real-time signals for ${setup.symbol} (zone entry)`);
              triggeredSetups.push(setup.symbol);
            }
          } catch (err) {
            console.error(`[Setups] Signal generation failed for ${setup.symbol}:`, err);
          }
        }
      }
    }
    
    // Mark triggered setups as inactive in database (they go to signals page)
    for (const symbol of triggeredSetups) {
      const setup = setupsCache.find(s => s.symbol === symbol);
      if (setup) {
        try {
          await prisma.tradeSetup.update({
            where: { id: setup.id },
            data: { active: false }
          });
          console.log(`[Setups] Marked ${symbol} as inactive (sent to signals)`);
        } catch (err) {
          console.error(`[Setups] Failed to mark ${symbol} as inactive:`, err);
        }
      }
    }

    // Remove triggered setups from cache so they disappear from setups page
    // (they live on in Setup History and Signals page)
    const triggeredRemoved = setupsCache.filter(s => s.status === 'triggered').length;
    setupsCache = setupsCache.filter(s => s.status !== 'triggered');
    if (triggeredRemoved > 0) {
      console.log(`[Setups] Removed ${triggeredRemoved} triggered setups from active cache`);
    }

    // Apply tier-based filtering - fetch from database
    const userId = (req as any).userId;
    let tier = 'starter';
    
    if (userId) {
      try {
        const user = await getUserWithSubscription(userId);
        if (user) {
          tier = user.subscriptionTier || 'starter';
          console.log(`[Setups] User ${userId} tier: ${tier}`);
        }
      } catch (err) {
        console.error('[Setups] Error fetching user tier:', err);
      }
    }
    
    let filteredSetups = updatedSetups;
    
    if (tier === 'starter') {
      // STARTER: Show only 2 setups (taster tier)
      filteredSetups = updatedSetups
        .sort((a, b) => {
          const aStatus = a.status === 'NEAR TRIGGER' ? 2 : a.status === 'FORMING' ? 1 : 0;
          const bStatus = b.status === 'NEAR TRIGGER' ? 2 : b.status === 'FORMING' ? 1 : 0;
          if (aStatus !== bStatus) return bStatus - aStatus;
          return b.confidence - a.confidence;
        })
        .slice(0, 2);
    } else if (tier === 'pro') {
      // PRO/ACTIVE TRADER: Show 6 setups (enough for active portfolio)
      filteredSetups = updatedSetups
        .sort((a, b) => {
          const aStatus = a.status === 'NEAR TRIGGER' ? 2 : a.status === 'FORMING' ? 1 : 0;
          const bStatus = b.status === 'NEAR TRIGGER' ? 2 : b.status === 'FORMING' ? 1 : 0;
          if (aStatus !== bStatus) return bStatus - aStatus;
          return b.confidence - a.confidence;
        })
        .slice(0, 6);
    }
    // LIFETIME/ALPHA: All 12 setups (full market coverage)
    // PRO and LIFETIME: unlimited setups

    // Calculate if user hit their tier limit
    const tierLimits = { starter: 2, pro: 6, lifetime: 12 };
    const userLimit = tierLimits[tier as keyof typeof tierLimits] || 12;
    const limitReached = updatedSetups.length > filteredSetups.length || filteredSetups.length >= userLimit;
    
    res.json({
      setups: filteredSetups,
      tier,
      limitReached,
      totalAvailable: updatedSetups.length,
      totalShown: filteredSetups.length,
      tierLimit: userLimit,
      usingCachedData,
      cacheAge: usingCachedData ? Math.round((now - lastCacheUpdate) / 1000) : 0
    });
  } catch (error) {
    console.error('Error fetching setups:', error);
    // Return empty setups instead of error - frontend handles empty state
    res.json({
      setups: [],
      tier: 'lifetime',
      limitReached: false,
      totalAvailable: 0,
      totalShown: 0,
      tierLimit: 12,
      usingCachedData: true,
      cacheAge: 0,
      error: 'Market data temporarily unavailable'
    });
  }
});

// POST /api/setups/generate - Force regenerate setups
router.post('/generate', async (req, res) => {
  try {
    console.log('Force generating new trade setups...');
    setupsCache = await tradeSetupEngine.generateSetups(12);
    
    // Persist the new setups
    await tradeSetupEngine.persistSetups(setupsCache);
    
    lastCacheUpdate = Date.now();
    
    const transformedSetups = setupsCache.map(transformSetupForFrontend);
    res.json(transformedSetups);
  } catch (error) {
    console.error('Error generating setups:', error);
    res.status(500).json({ error: 'Failed to generate trade setups' });
  }
});

// GET /api/setups/stats - Get setup statistics
router.get('/stats', async (req, res) => {
  try {
    const setups = setupsCache.length > 0 ? setupsCache : await tradeSetupEngine.generateSetups(12);
    
    const stats = {
      total: setups.length,
      byStatus: {
        FORMING: setups.filter(s => s.status === 'forming').length,
        'NEAR TRIGGER': setups.filter(s => s.status === 'near_trigger').length,
        TRIGGERED: setups.filter(s => s.status === 'triggered').length,
        EXPIRED: setups.filter(s => s.status === 'expired').length
      },
      byBias: {
        bullish: setups.filter(s => s.bias === 'bullish').length,
        bearish: setups.filter(s => s.bias === 'bearish').length
      },
      byRisk: {
        LOW: setups.filter(s => s.riskLevel === 'LOW').length,
        MEDIUM: setups.filter(s => s.riskLevel === 'MEDIUM').length,
        HIGH: setups.filter(s => s.riskLevel === 'HIGH').length
      },
      avgConfidence: setups.length > 0 
        ? Math.round(setups.reduce((acc, s) => acc + s.confidenceScore, 0) / setups.length)
        : 0,
      avgRiskReward: setups.length > 0
        ? (setups.reduce((acc, s) => acc + s.riskRewardRatio, 0) / setups.length).toFixed(2)
        : '0.00'
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// DELETE /api/setups/clear - Clear all setups from cache
router.delete('/clear', async (req, res) => {
  try {
    setupsCache = [];
    lastCacheUpdate = 0;
    res.json({ message: 'All setups cleared', count: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/setups/scan-status - Get scheduler status
router.get('/scan-status', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const tier = user?.subscriptionTier || 'starter';
    
    const status = setupSchedulerService.getStatus();
    const hoursUntilNext = SCAN_INTERVALS[tier as keyof typeof SCAN_INTERVALS] / (60 * 60 * 1000);
    const setupsLimit = setupSchedulerService.getSetupsLimit(tier as 'starter' | 'pro' | 'lifetime');
    
    // Calculate next scan for this user's tier
    const lastScan = status.lastScan ? new Date(status.lastScan) : new Date(0);
    const nextScan = new Date(lastScan.getTime() + SCAN_INTERVALS[tier as keyof typeof SCAN_INTERVALS]);
    const now = new Date();
    const isOverdue = now > nextScan;
    const hoursRemaining = Math.max(0, Math.ceil((nextScan.getTime() - now.getTime()) / (1000 * 60 * 60)));
    
    res.json({
      schedulerRunning: status.isRunning,
      lastScan: status.lastScan,
      nextScan: nextScan.toISOString(),
      hoursRemaining,
      isOverdue,
      tier,
      scanFrequency: `${hoursUntilNext} hours`,
      setupsPerScan: setupsLimit,
      totalSetupsGenerated: 12
    });
  } catch (error) {
    console.error('Error getting scan status:', error);
    res.status(500).json({ error: 'Failed to get scan status' });
  }
});

// POST /api/setups/force-scan - Force immediate scan (admin only)
router.post('/force-scan', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Check if user is lifetime/pro
    if (user?.subscriptionTier !== 'lifetime' && user?.subscriptionTier !== 'pro') {
      return res.status(403).json({ error: 'Requires PRO or LIFETIME tier' });
    }
    
    const count = await setupSchedulerService.forceScan();
    
    // Reset cache to force refresh
    setupsCache = [];
    lastCacheUpdate = 0;
    
    res.json({ 
      message: `Force scan complete. Generated ${count} setups.`,
      setupsGenerated: count
    });
  } catch (error) {
    console.error('Error force scanning:', error);
    res.status(500).json({ error: 'Failed to force scan' });
  }
});

// Get setup history (only setups that were actually shown to users)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    let tier = 'starter';
    
    if (userId) {
      try {
        const user = await getUserWithSubscription(userId);
        if (user) tier = user.subscriptionTier || 'starter';
      } catch (err) {
        console.error('[SetupHistory] Error fetching user tier:', err);
      }
    }
    
    // Only PRO/LIFETIME can see full history
    const limit = tier === 'lifetime' ? 500 : tier === 'pro' ? 100 : 20;
    
    // Only fetch setups from last 7 days that were actually shown to users
    // This prevents showing hundreds of old expired setups
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const history = await prisma.tradeSetup.findMany({
      where: {
        // Only setups from last 7 days
        createdAt: { gte: sevenDaysAgo },
        // Only setups that were active at some point (shown to users)
        OR: [
          { active: true },
          { status: { in: ['triggered', 'near_trigger', 'expired'] } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    const mapped = history.map(setup => {
      const entryZone = JSON.parse(setup.entryZone || '{"low":0,"high":0}');
      const targets = JSON.parse(setup.targets || '[]');
      
      return {
        id: setup.id,
        symbol: setup.asset,
        direction: setup.direction,
        status: setup.status,
        active: setup.active,
        entryZone,
        stopLoss: setup.stopLoss,
        targets,
        confidence: setup.confidence,
        riskLevel: setup.riskLevel,
        strategyType: setup.strategyType,
        timeframe: setup.timeframe,
        reasoning: setup.reasoning,
        createdAt: setup.createdAt,
        expiresAt: setup.expiresAt
      };
    });
    
    res.json({ 
      setups: mapped, 
      count: mapped.length,
      tier,
      canAccessFullHistory: tier !== 'starter'
    });
  } catch (error) {
    console.error('[SetupHistory] Error:', error);
    res.status(500).json({ error: 'Failed to fetch setup history' });
  }
});

// DEBUG: Manual trigger test - force a setup to trigger and generate signal
router.post('/test-trigger/:setupId', authenticateToken, async (req, res) => {
  try {
    const { setupId } = req.params;
    const setup = await prisma.tradeSetup.findUnique({ where: { id: setupId } });
    
    if (!setup) {
      return res.status(404).json({ error: 'Setup not found' });
    }
    
    // Update to triggered status
    await prisma.tradeSetup.update({
      where: { id: setupId },
      data: { status: 'triggered' }
    });
    
    // Get current price
    const currentPrices = await fetchCurrentPrices();
    const currentPrice = currentPrices[setup.asset] || 0;
    
    // Generate signal
    const signals = await signalEngine.generateSignalsFromSetups(setup.asset, currentPrice);
    
    res.json({
      success: true,
      message: `Setup ${setup.asset} manually triggered`,
      setupId,
      currentPrice,
      signalsGenerated: signals.length,
      signals: signals.map(s => ({
        id: s.id,
        symbol: s.symbol,
        direction: s.direction,
        entry: s.entry,
        status: s.status
      }))
    });
  } catch (error) {
    console.error('[TestTrigger] Error:', error);
    res.status(500).json({ error: 'Test trigger failed' });
  }
});

export default router;
