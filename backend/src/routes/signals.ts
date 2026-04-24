import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { signalEngine } from '../services/signalEngine';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getUserWithSubscription } from '../services/permissionService';
import { 
  requireTier, 
  requireFeature, 
  requireUsageLimit,
  optionalAuth 
} from '../middleware/permissions';

const router = Router();
const prisma = new PrismaClient();

// Public preview endpoint - limited signals for marketing (only from trade setups)
router.get('/public/preview', async (req, res) => {
  try {
    const previewSignals = await prisma.signal.findMany({
      where: {
        status: { in: ['FORMING', 'TRIGGERED'] },
        parentSetupId: { not: null } // Only signals from trade setups
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    const mapped = previewSignals.map(s => ({
      id: s.id,
      coin: s.coin,
      direction: s.direction,
      entry: (s.entryMin + s.entryMax) / 2,
      confidence: s.confidence,
      timeframe: s.timeframe,
      strategy: s.setupType,
      createdAt: s.createdAt,
      stopLoss: 'Upgrade to view',
      takeProfit: 'Upgrade to view',
      isPreview: true
    }));

    res.json({
      signals: mapped,
      count: mapped.length,
      message: 'Upgrade to see all signals with full details'
    });
  } catch (error) {
    console.error('Error fetching signal preview:', error);
    res.json({ signals: [], count: 0, message: 'Upgrade to see all signals with full details' });
  }
});

// Get all signals (PRO/LIFETIME: unlimited, STARTER: 1 signal max)
router.get('/', 
  authenticateToken,
  requireTier('starter'),
  async (req: AuthRequest, res) => {
    try {
      const { timeframe, strategy, confidence, status } = req.query;

      const where: any = {
        status: status ? status as string : { in: ['FORMING', 'TRIGGERED', 'ACTIVE'] },
        parentSetupId: { not: null } // Only signals generated from trade setups
      };

      if (timeframe) where.timeframe = timeframe as string;
      if (strategy) where.setupType = strategy as string;
      if (confidence) where.confidence = { gte: parseInt(confidence as string) };

      const signals = await prisma.signal.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      });

      // Apply tier-based filtering - fetch from database
      const userId = (req as any).userId;
      let tier = 'starter';
      
      console.log(`[Signals] Request received, userId: ${userId}, token present: ${!!req.headers.authorization}`);
      
      if (userId) {
        try {
          const user = await getUserWithSubscription(userId);
          console.log(`[Signals] User lookup result:`, user ? { id: user.id, tier: user.subscriptionTier, status: user.subscriptionStatus } : 'null');
          if (user) {
            tier = user.subscriptionTier || 'starter';
            console.log(`[Signals] User ${userId} tier detected: ${tier}`);
          } else {
            console.log(`[Signals] User ${userId} not found in database`);
          }
        } catch (err) {
          console.error('[Signals] Error fetching user tier:', err);
        }
      } else {
        console.log(`[Signals] No userId in request - user not authenticated`);
      }
      
      let filteredSignals = signals;
      
      if (tier === 'starter') {
        // STARTER: Show only 1 active signal (highest confidence)
        filteredSignals = signals
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 1);
      }
      // PRO and LIFETIME: unlimited signals

      const mapped = filteredSignals.map(s => ({
        id: s.id,
        coin: s.coin,
        direction: s.direction,
        entry: (s.entryMin + s.entryMax) / 2,
        stopLoss: s.stopLoss,
        takeProfit: s.target1,
        takeProfit1: s.target1,
        takeProfit2: s.target2,
        takeProfit3: s.target3,
        confidence: s.confidence,
        timeframe: s.timeframe,
        strategy: s.setupType,
        strategyType: s.strategyType,
        status: s.status.toLowerCase(),
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        ema50: s.ema50,
        ema200: s.ema200,
        rsi: s.rsi,
        volume: s.volume,
        parentSetupId: s.parentSetupId // Include parent setup reference
      }));

      res.json({
        signals: mapped,
        tier,
        limitReached: tier === 'starter' && signals.length > filteredSignals.length,
        totalAvailable: signals.length,
        totalShown: filteredSignals.length
      });
    } catch (error) {
      console.error('Error fetching signals:', error);
      res.json({ signals: [], tier: 'starter', limitReached: false, totalAvailable: 0, totalShown: 0 });
    }
  }
);

// Get signal performance
router.get('/performance', async (req, res) => {
  try {
    const totalSignals = await prisma.signal.count();
    const success = await prisma.signal.count({ where: { status: 'SUCCESS' } });
    const failed = await prisma.signal.count({ where: { status: 'FAILED' } });
    const triggered = await prisma.signal.count({ where: { status: 'TRIGGERED' } });

    const completed = success + failed;
    const winRate = completed > 0 ? (success / completed) * 100 : 0;

    res.json({
      totalSignals,
      winningSignals: success,
      losingSignals: failed,
      winRate: Math.round(winRate * 100) / 100,
      avgRiskReward: 0,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.json({
      totalSignals: 0,
      winningSignals: 0,
      losingSignals: 0,
      winRate: 0,
      avgRiskReward: 0,
      lastUpdated: new Date()
    });
  }
});

// Get enhanced signal with full market context (PRO/LIFETIME)
router.get('/:id/enhanced',
  authenticateToken,
  requireTier('pro'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const enhancedSignal = await signalEngine.getEnhancedSignal(id);
      
      if (!enhancedSignal) {
        return res.status(404).json({ error: 'Signal not found' });
      }
      
      res.json(enhancedSignal);
    } catch (error) {
      console.error('Error fetching enhanced signal:', error);
      res.status(500).json({ error: 'Failed to fetch enhanced signal' });
    }
  }
);

// Get signals with structure context (PRO/LIFETIME)
router.get('/enhanced',
  authenticateToken,
  requireTier('pro'),
  async (req: AuthRequest, res) => {
    try {
      const { timeframe, strategy, status } = req.query;
      
      const where: any = {
        status: status ? status as string : { in: ['FORMING', 'TRIGGERED', 'ACTIVE'] }
      };
      
      if (timeframe) where.timeframe = timeframe as string;
      if (strategy) where.strategy = strategy as string;
      
      const signals = await prisma.signal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      
      // Enhance each signal with market context
      const enhanced = await Promise.all(
        signals.map(async (s) => {
          const enhanced = await signalEngine.getEnhancedSignal(s.id);
          return enhanced || {
            id: s.id,
            coin: s.coin,
            symbol: s.symbol,
            direction: s.direction,
            timeframe: s.timeframe,
            strategy: s.strategy,
            entry: (s.entryMin + s.entryMax) / 2,
            entryMin: s.entryMin,
            entryMax: s.entryMax,
            stopLoss: s.stopLoss,
            takeProfit1: s.target1,
            takeProfit2: s.target2,
            riskReward: (s.target1 - (s.entryMin + s.entryMax) / 2) / Math.abs(s.stopLoss - (s.entryMin + s.entryMax) / 2),
            confidence: s.confidence,
            status: s.status,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt
          };
        })
      );
      
      res.json(enhanced);
    } catch (error) {
      console.error('Error fetching enhanced signals:', error);
      res.status(500).json({ error: 'Failed to fetch enhanced signals' });
    }
  }
);

// Manual scan trigger
router.post('/scan', async (req, res) => {
  try {
    await signalEngine.runSignalScan();
    res.json({ message: 'Signal scan completed' });
  } catch (error) {
    console.error('Error running scan:', error);
    res.status(500).json({ error: 'Failed to run scan' });
  }
});

// Get signal journal (all signals including completed with P&L)
router.get('/journal', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = (req as any).userId;
    let tier = 'starter';
    
    if (userId) {
      try {
        const user = await getUserWithSubscription(userId);
        if (user) tier = user.subscriptionTier || 'starter';
      } catch (err) {
        console.error('[SignalJournal] Error fetching user tier:', err);
      }
    }
    
    // Only PRO/LIFETIME can see full journal
    const limit = tier === 'lifetime' ? 500 : tier === 'pro' ? 100 : 20;
    
    const signals = await prisma.signal.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    // Calculate P&L metrics
    let totalProfit = 0;
    let totalLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    
    const mapped = signals.map(s => {
      const entryPrice = (s.entryMin + s.entryMax) / 2;
      const exitPrice = s.exitPrice || entryPrice;
      let pnlPercent = s.pnlPercent || 0;
      
      // Calculate P&L if not stored
      if (!s.pnlPercent && s.status === 'SUCCESS') {
        pnlPercent = s.direction === 'LONG' 
          ? ((exitPrice - entryPrice) / entryPrice * 100)
          : ((entryPrice - exitPrice) / entryPrice * 100);
        totalProfit += Math.max(0, pnlPercent);
        winCount++;
      } else if (!s.pnlPercent && s.status === 'FAILED') {
        pnlPercent = s.direction === 'LONG'
          ? ((exitPrice - entryPrice) / entryPrice * 100)
          : ((entryPrice - exitPrice) / entryPrice * 100);
        totalLoss += Math.abs(Math.min(0, pnlPercent));
        lossCount++;
      }
      
      return {
        id: s.id,
        coin: s.coin,
        symbol: s.symbol,
        direction: s.direction,
        status: s.status,
        entry: entryPrice,
        entryMin: s.entryMin,
        entryMax: s.entryMax,
        stopLoss: s.stopLoss,
        takeProfit: s.target1,
        exitPrice: s.exitPrice,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        riskReward: s.target1 && s.stopLoss ? 
          Math.abs((s.target1 - entryPrice) / (s.stopLoss - entryPrice)) : 2,
        confidence: s.confidence,
        timeframe: s.timeframe,
        strategy: s.setupType,
        createdAt: s.createdAt,
        triggeredAt: s.triggeredAt,
        expiresAt: s.expiresAt,
        parentSetupId: s.parentSetupId
      };
    });
    
    // Calculate summary stats
    const completedSignals = signals.filter(s => ['SUCCESS', 'FAILED'].includes(s.status));
    const avgWin = winCount > 0 ? totalProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;
    const winRate = completedSignals.length > 0 ? (winCount / completedSignals.length * 100) : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    
    res.json({
      signals: mapped,
      count: mapped.length,
      tier,
      canAccessFullJournal: tier !== 'starter',
      summary: {
        totalSignals: signals.length,
        completedTrades: completedSignals.length,
        winRate: Math.round(winRate * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalLoss: Math.round(totalLoss * 100) / 100,
        netPnl: Math.round((totalProfit - totalLoss) * 100) / 100
      }
    });
  } catch (error) {
    console.error('[SignalJournal] Error:', error);
    res.status(500).json({ error: 'Failed to fetch signal journal' });
  }
});

// Start signal scanner - runs every 5 minutes
export function startSignalScanner() {
  console.log('🚀 Starting signal scanner...');

  signalEngine.runSignalScan().catch(console.error);

  setInterval(() => {
    signalEngine.updateSignalStatuses().catch(console.error);
  }, 60 * 1000);

  setInterval(() => {
    console.log('📊 Running signal scan...');
    signalEngine.runSignalScan().catch((error: Error) => {
      console.error('Signal scan error:', error);
    });
  }, 5 * 60 * 1000);
}

export default router;
