import { alphaPicksService } from './alphaPicksService';

// 5 days in milliseconds
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

class SchedulerService {
  private lastScanTime: Date | null = null;
  private scanTimeout: NodeJS.Timeout | null = null;

  /**
   * Start the automatic market scanner
   * Checks if a scan is due on startup and schedules the next one
   */
  async start(): Promise<void> {
    console.log('[Scheduler] Starting automatic market scanner...');
    
    // Check if we need to run immediately (e.g., if 5+ days passed since last scan)
    const shouldRunNow = await this.shouldRunScan();
    
    if (shouldRunNow) {
      console.log('[Scheduler] Scan overdue, running now...');
      await this.runScan();
    } else {
      console.log('[Scheduler] Scan not due yet, scheduling next run');
    }
    
    // Schedule the next scan
    this.scheduleNextScan();
  }

  /**
   * Check if a scan should run based on last scan time
   */
  private async shouldRunScan(): Promise<boolean> {
    // For now, check if picks exist in the database
    // If no picks exist, we should run immediately
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const count = await prisma.alphaPick.count();
      
      if (count === 0) {
        console.log('[Scheduler] No Alpha Picks found, will run scan');
        return true;
      }
      
      // Check the most recently created pick
      const latestPick = await prisma.alphaPick.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      
      if (!latestPick) return true;
      
      const timeSinceLastScan = Date.now() - latestPick.createdAt.getTime();
      const shouldRun = timeSinceLastScan >= FIVE_DAYS_MS;
      
      console.log(`[Scheduler] Last scan: ${latestPick.createdAt.toISOString()}, Time since: ${Math.floor(timeSinceLastScan / (1000 * 60 * 60 * 24))} days, Should run: ${shouldRun}`);
      
      return shouldRun;
    } catch (error) {
      console.error('[Scheduler] Error checking last scan:', error);
      return false;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Run the market scan and generate 1-2 Alpha Picks
   */
  private async runScan(): Promise<void> {
    console.log('[Scheduler] Running automatic market scan...');
    
    try {
      // Modify the scan to only generate 1-2 picks
      const result = await this.scanWithLimitedPicks(2);
      console.log(`[Scheduler] Scan complete. Created ${result.created} Alpha Picks.`);
      this.lastScanTime = new Date();
    } catch (error) {
      console.error('[Scheduler] Error during scan:', error);
    }
  }

  /**
   * Schedule the next scan in 5 days
   */
  private scheduleNextScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    
    console.log(`[Scheduler] Next scan scheduled in 5 days`);
    
    this.scanTimeout = setTimeout(async () => {
      await this.runScan();
      this.scheduleNextScan();
    }, FIVE_DAYS_MS);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    console.log('[Scheduler] Stopped');
  }

  /**
   * Scan market but limit to max picks
   */
  private async scanWithLimitedPicks(maxPicks: number): Promise<{ created: number; picks: any[] }> {
    const { marketDataService } = await import('./marketDataService');
    const { aiResearchService } = await import('./aiResearchService');
    const { PrismaClient } = await import('@prisma/client');
    
    const prisma = new PrismaClient();
    
    try {
      console.log(`[Scheduler] Scanning for up to ${maxPicks} opportunities...`);
      
      const opportunities = await marketDataService.findOpportunities();
      console.log(`[Scheduler] Found ${opportunities.length} potential opportunities`);
      
      const createdPicks = [];
      
      for (const coin of opportunities.slice(0, maxPicks)) {
        try {
          const report = await aiResearchService.generateResearch(coin.id, coin);
          
          if (!report) {
            console.log(`[Scheduler] Skipping ${coin.name} - could not generate report`);
            continue;
          }
          
          // Check if pick already exists
          const existing = await prisma.alphaPick.findFirst({
            where: { ticker: report.ticker }
          });
          
          if (existing) {
            // Update with new data
            await prisma.alphaPick.update({
              where: { id: existing.id },
              data: {
                confidenceScore: report.confidenceScore,
                accumulationZones: JSON.stringify(report.accumulationZones),
                status: report.confidenceScore > 80 ? 'ACCUMULATING' : 'WATCHING',
                target1: report.targets.tp1,
                target2: report.targets.tp2,
                target3: report.targets.tp3,
                invalidation: report.invalidation
              }
            });
            console.log(`[Scheduler] Updated existing pick: ${report.coinName}`);
          } else {
            // Create new pick
            const newPick = await prisma.alphaPick.create({
              data: {
                coinName: report.coinName,
                ticker: report.ticker,
                sector: report.sector,
                marketCapCategory: report.marketCapCategory,
                executiveSummary: JSON.stringify(report.executiveSummary),
                thesis: report.thesis,
                narrative: report.narrative,
                useCase: report.useCase,
                tokenomics: JSON.stringify(report.tokenomics),
                teamInvestors: JSON.stringify({ team: 'See CoinGecko for latest info' }),
                competitiveEdge: report.competitiveEdge,
                onChainData: JSON.stringify(report.onChainData),
                marketStructure: 'bullish',
                accumulationZones: JSON.stringify(report.accumulationZones),
                liquidityAreas: JSON.stringify({
                  demandZones: [`$${report.accumulationZones[1]}-$${report.accumulationZones[0]}`],
                  liquiditySweeps: 'Monitoring for sweep patterns',
                  structure: 'Active analysis'
                }),
                executionPlan: `Accumulate in 3 tranches: ${report.accumulationZones.map((z: number) => `$${z}`).join(', ')}. Scale out at targets: $${report.targets.tp1}, $${report.targets.tp2}, $${report.targets.tp3}.`,
                invalidation: report.invalidation,
                timeHorizon: 'POSITION',
                target1: report.targets.tp1,
                target2: report.targets.tp2,
                target3: report.targets.tp3,
                catalysts: JSON.stringify(report.catalysts),
                risks: JSON.stringify(report.risks),
                confidenceScore: report.confidenceScore,
                status: report.confidenceScore > 80 ? 'ACCUMULATING' : 'WATCHING'
              }
            });
            createdPicks.push(newPick);
            console.log(`[Scheduler] Created new pick: ${report.coinName} (${report.ticker})`);
          }
        } catch (error) {
          console.error(`[Scheduler] Error processing ${coin.name}:`, error);
        }
      }
      
      return { created: createdPicks.length, picks: createdPicks };
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Get last scan time
   */
  getLastScanTime(): Date | null {
    return this.lastScanTime;
  }
}

export const schedulerService = new SchedulerService();
