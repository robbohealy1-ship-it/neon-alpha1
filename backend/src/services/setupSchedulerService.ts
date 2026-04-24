import { tradeSetupEngine } from './tradeSetupEngine';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Scan intervals by tier
const SCAN_INTERVALS = {
  starter: 24 * 60 * 60 * 1000,   // 24 hours for starter
  pro: 6 * 60 * 60 * 1000,        // 6 hours for pro  
  lifetime: 4 * 60 * 60 * 1000    // 4 hours for lifetime
};

// Maximum active setups allowed
const MAX_SETUPS = 12;

class SetupSchedulerService {
  private lastScanTime: Date | null = null;
  private scanTimeout: NodeJS.Timeout | null = null;
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  // Status check runs every 2 minutes to monitor price movements
  private readonly STATUS_CHECK_INTERVAL = 2 * 60 * 1000;

  /**
   * Start the automatic setup scanner
   * Runs different frequencies based on user tier
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('[SetupScheduler] Starting automatic setup scanner...');
    this.isRunning = true;
    
    // Initial scan on startup
    await this.runScan();
    
    // Schedule recurring scans (use most frequent - lifetime tier)
    this.scheduleNextScan();
    
    // Start continuous status monitoring
    this.startStatusMonitoring();
    
    console.log('[SetupScheduler] Status monitoring started (checks every 2 minutes)');
  }
  
  /**
   * Continuously monitor active setups and update their status based on price action
   * Runs every 2 minutes to detect FORMING → NEAR_TRIGGER → TRIGGERED transitions
   */
  private startStatusMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    
    this.statusCheckInterval = setInterval(async () => {
      await this.checkAndUpdateSetupStatuses();
    }, this.STATUS_CHECK_INTERVAL);
  }
  
  /**
   * Check all active setups and update their status based on current prices
   */
  private async checkAndUpdateSetupStatuses(): Promise<void> {
    try {
      // Get all active setups from database
      const activeSetups = await prisma.tradeSetup.findMany({
        where: { 
          active: true,
          status: { in: ['forming', 'near_trigger'] } // Only check non-triggered setups
        }
      });
      
      console.log(`[StatusMonitor] Checking ${activeSetups.length} active setups`);
      
      if (activeSetups.length === 0) {
        console.log('[StatusMonitor] No active setups to check');
        return;
      }
      
      // Log setup details
      activeSetups.forEach(s => {
        const entry = JSON.parse(s.entryZone || '{"low":0,"high":0}');
        console.log(`[StatusMonitor] Setup: ${s.asset} | Status: ${s.status} | Entry: ${entry.low}-${entry.high}`);
      });
      
      // Get unique symbols
      const symbols = [...new Set(activeSetups.map(s => s.asset))];
      
      // Fetch current prices
      const prices: Record<string, number> = {};
      for (const symbol of symbols) {
        try {
          // Format symbol for Binance API - add USDT suffix if missing
          const binanceSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
          const response = await axios.get(
            `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
          );
          prices[symbol] = parseFloat(response.data.price);
        } catch (err) {
          console.log(`[StatusMonitor] No price for ${symbol} (not on Binance)`);
        }
      }
      
      console.log(`[StatusMonitor] Fetched prices for ${Object.keys(prices).length}/${symbols.length} symbols`);
      Object.entries(prices).forEach(([sym, price]) => {
        console.log(`[StatusMonitor] ${sym}: $${price}`);
      });
      
      // Check each setup and update status
      let updatedCount = 0;
      let triggeredCount = 0;
      
      for (const setup of activeSetups) {
        const currentPrice = prices[setup.asset];
        if (!currentPrice) continue;
        
        const entryZone = JSON.parse(setup.entryZone || '{"low":0,"high":0}');
        const stopLoss = setup.stopLoss;
        const bias = setup.direction;
        
        // Check if triggered (price in entry zone)
        const entryHit = bias === 'bullish' 
          ? currentPrice >= entryZone.low && currentPrice <= entryZone.high
          : currentPrice <= entryZone.high && currentPrice >= entryZone.low;
        
        if (entryHit && setup.status !== 'triggered') {
          // Update to triggered
          await prisma.tradeSetup.update({
            where: { id: setup.id },
            data: { 
              status: 'triggered',
              active: false // Move to signals/history
            }
          });
          
          // Generate signal for this triggered setup
          const { signalEngine } = require('./signalEngine');
          await signalEngine.generateSignalsFromSetups(setup.asset, currentPrice);
          
          console.log(`[StatusMonitor] ${setup.asset} TRIGGERED at ${currentPrice} (entry: ${entryZone.low}-${entryZone.high})`);
          triggeredCount++;
          updatedCount++;
          continue;
        }
        
        // Check if near trigger (within 2% of entry mid)
        const entryMid = (entryZone.low + entryZone.high) / 2;
        const nearTrigger = Math.abs(currentPrice - entryMid) / entryMid < 0.02;
        
        if (nearTrigger && setup.status === 'forming') {
          await prisma.tradeSetup.update({
            where: { id: setup.id },
            data: { status: 'near_trigger' }
          });
          console.log(`[StatusMonitor] ${setup.asset} NEAR_TRIGGER at ${currentPrice} (entry: ${entryZone.low}-${entryZone.high})`);
          updatedCount++;
          continue;
        }
        
        // Check if invalidated (hit stop loss)
        if (stopLoss) {
          const invalidated = bias === 'bullish'
            ? currentPrice <= stopLoss
            : currentPrice >= stopLoss;
          
          if (invalidated) {
            await prisma.tradeSetup.update({
              where: { id: setup.id },
              data: { 
                status: 'expired',
                active: false
              }
            });
            console.log(`[StatusMonitor] ${setup.asset} EXPIRED (hit stop loss) at ${currentPrice}`);
            updatedCount++;
          }
        }
      }
      
      if (updatedCount > 0) {
        console.log(`[StatusMonitor] Updated ${updatedCount} setups (${triggeredCount} triggered)`);
      }
    } catch (error) {
      console.error('[StatusMonitor] Error checking setup statuses:', error);
    }
  }

  /**
   * Run a market scan and generate setups
   * Only generates enough to fill up to MAX_SETUPS (12), not always 12
   */
  private async runScan(): Promise<void> {
    console.log('[SetupScheduler] Running market scan for trade setups...');
    
    try {
      // Count current active setups
      const activeSetups = await prisma.tradeSetup.count({
        where: { active: true }
      });
      
      // Calculate how many more we need (up to MAX_SETUPS)
      const needed = Math.max(0, MAX_SETUPS - activeSetups);
      
      if (needed === 0) {
        console.log(`[SetupScheduler] Already have ${activeSetups} active setups (max ${MAX_SETUPS}). Skipping scan.`);
        this.lastScanTime = new Date();
        return;
      }
      
      console.log(`[SetupScheduler] Have ${activeSetups} active setups, generating ${needed} more to reach ${MAX_SETUPS}`);
      
      // Generate only the needed amount
      const setups = await tradeSetupEngine.generateSetups(needed);
      
      // Persist to database
      await tradeSetupEngine.persistSetups(setups);
      
      console.log(`[SetupScheduler] Generated and persisted ${setups.length} setups (now have ${activeSetups + setups.length} total)`);
      this.lastScanTime = new Date();
    } catch (error) {
      console.error('[SetupScheduler] Error during scan:', error);
    }
  }

  /**
   * Schedule next scan based on tier
   * Uses the most frequent interval (lifetime) for the scheduler
   * In production, you'd check user tier and adjust accordingly
   */
  private scheduleNextScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    
    // Use lifetime interval (4 hours) for auto-refresh
    const interval = SCAN_INTERVALS.lifetime;
    const hours = interval / (60 * 60 * 1000);
    
    console.log(`[SetupScheduler] Next scan scheduled in ${hours} hours`);
    
    this.scanTimeout = setTimeout(async () => {
      await this.runScan();
      this.scheduleNextScan();
    }, interval);
  }

  /**
   * Get next scan time based on tier
   */
  getNextScanTime(tier: 'starter' | 'pro' | 'lifetime' = 'lifetime'): Date {
    const interval = SCAN_INTERVALS[tier];
    const lastScan = this.lastScanTime || new Date();
    return new Date(lastScan.getTime() + interval);
  }

  /**
   * Get scan frequency for tier
   */
  getScanFrequency(tier: 'starter' | 'pro' | 'lifetime'): string {
    const hours = SCAN_INTERVALS[tier] / (60 * 60 * 1000);
    return `${hours} hours`;
  }

  /**
   * Get setups per scan limit by tier
   */
  getSetupsLimit(tier: 'starter' | 'pro' | 'lifetime'): number {
    const limits = {
      starter: 2,    // Starter: Just a taste
      pro: 6,        // Active Trader: Enough to build a portfolio
      lifetime: 12   // Alpha: Full market coverage
    };
    return limits[tier];
  }

  /**
   * Force immediate scan (admin only)
   */
  async forceScan(): Promise<number> {
    console.log('[SetupScheduler] Force scan triggered');
    await this.runScan();
    return 12;
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.isRunning = false;
    console.log('[SetupScheduler] Stopped');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastScan: this.lastScanTime?.toISOString() || null,
      nextScan: this.isRunning ? this.getNextScanTime().toISOString() : null
    };
  }
}

export const setupSchedulerService = new SetupSchedulerService();
export { SCAN_INTERVALS };
