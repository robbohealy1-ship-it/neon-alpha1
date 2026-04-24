import { PrismaClient } from '@prisma/client';
import { marketDataService } from './marketDataService';
import { aiResearchService } from './aiResearchService';

const prisma = new PrismaClient();

class AlphaPicksService {
  async resetSampleData(): Promise<void> {
    // Clear existing data and create fresh samples
    await prisma.alphaPickBookmark.deleteMany();
    await prisma.alphaPickPerformance.deleteMany();
    await prisma.alphaPick.deleteMany();
    await this.initializeSampleData(true);
  }

  async initializeSampleData(force = false): Promise<void> {
    const count = await prisma.alphaPick.count();

    if (count > 0 && !force) {
      return;
    }

    await prisma.alphaPick.createMany({
      data: [
        {
          coinName: 'NEAR Protocol',
          ticker: 'NEAR',
          sector: 'Infrastructure',
          marketCapCategory: 'MID',
          executiveSummary: JSON.stringify([
            'Chain abstraction thesis gaining traction across crypto',
            'Near AI positioning at the intersection of two major narratives',
            'Developer growth and product differentiation remain underpriced'
          ]),
          thesis: 'NEAR is increasingly being valued like a generic layer-1 despite building differentiated chain abstraction and AI-adjacent infrastructure. That disconnect creates a medium-term accumulation opportunity if product execution continues.',
          narrative: 'Chain abstraction and agentic UX are becoming more relevant as users seek seamless multi-chain experiences. NEAR sits inside that narrative at a time when the market is still rewarding clean, differentiated infrastructure stories.',
          useCase: 'NEAR provides scalable infrastructure, chain abstraction tooling, and AI-aligned wallet/account primitives that can benefit developers building cross-chain consumer applications.',
          tokenomics: JSON.stringify({
            totalSupply: '1B',
            inflation: 'Low single digits',
            unlocks: 'Largely mature',
            stakingRatio: 'Healthy validator participation'
          }),
          teamInvestors: JSON.stringify({
            founders: ['Illia Polosukhin', 'Alexander Skidanov'],
            investors: ['a16z', 'Pantera Capital', 'Coinbase Ventures']
          }),
          competitiveEdge: 'NEAR differentiates through abstraction-focused UX and a clearer product narrative than many competing infrastructure protocols.',
          onChainData: JSON.stringify({
            walletGrowth: 'Steady user and developer wallet expansion',
            exchangeFlows: 'Net outflows imply passive accumulation',
            whaleActivity: 'Larger holders have added on weakness',
            volumeAnomalies: 'Demand improves near value area support'
          }),
          marketStructure: 'bullish',
          accumulationZones: JSON.stringify([1.25, 1.10, 0.95]),
          liquidityAreas: JSON.stringify({
            demandZones: ['$1.20-$1.30', '$1.05-$1.15'],
            liquiditySweeps: 'Recent sweep of $1.20 low recovered strongly',
            structure: 'Higher-low sequence forming above key support'
          }),
          executionPlan: 'Scale 25% on first dip to $1.25, 35% on confirmation above $1.40, and 40% on breakout. Current price offers reasonable entry for long-term holders.',
          invalidation: 1.05,
          timeHorizon: 'POSITION',
          target1: 2.2,
          target2: 3.5,
          target3: 5.5,
          catalysts: JSON.stringify([
            'Product rollout tied to chain abstraction',
            'AI narrative strength',
            'Potential ecosystem partnership flow'
          ]),
          risks: JSON.stringify([
            'Narrative rotation away from infrastructure',
            'Broader crypto market weakness',
            'Execution slowdown versus competitors'
          ]),
          confidenceScore: 82,
          status: 'ACCUMULATING'
        },
        {
          coinName: 'Artificial Superintelligence Alliance',
          ticker: 'FET',
          sector: 'AI',
          marketCapCategory: 'HIGH',
          executiveSummary: JSON.stringify([
            'One of the cleanest liquid expressions of the AI narrative',
            'Watching for stronger structure before heavier sizing',
            'Valuation remains sensitive to narrative momentum'
          ]),
          thesis: 'FET remains a high-beta AI proxy with enough liquidity and narrative strength to warrant attention, but the best risk-adjusted returns likely come from patient accumulation after structure improves.',
          narrative: 'AI remains one of the strongest market narratives, but capital is increasingly rotating toward tokens with clearer utility and survivability. FET still commands attention as a liquid benchmark in that theme.',
          useCase: 'The project targets decentralized AI infrastructure, autonomous agents, and machine-to-machine economic coordination.',
          tokenomics: JSON.stringify({
            supply: 'Merged token base',
            inflation: 'Moderate / controlled',
            unlocks: 'Monitor treasury and ecosystem emissions'
          }),
          teamInvestors: JSON.stringify({
            backers: ['Strategic enterprise partners', 'Crypto native funds']
          }),
          competitiveEdge: 'Strong narrative recognition and comparatively deep liquidity versus many smaller AI names.',
          onChainData: JSON.stringify({
            walletGrowth: 'Mixed but stable',
            exchangeFlows: 'Neutral to mildly constructive',
            whaleActivity: 'Large wallets mostly inactive',
            volumeAnomalies: 'Volume contracts during basing periods'
          }),
          marketStructure: 'neutral',
          accumulationZones: JSON.stringify([0.48, 0.42, 0.36]),
          liquidityAreas: JSON.stringify({
            demandZones: ['$0.45-$0.50', '$0.38-$0.42'],
            liquiditySweeps: 'Swept $0.45 lows; watching for reclaim',
            structure: 'Building base after sharp correction'
          }),
          executionPlan: 'Initial 20% at current levels, add 30% on dip to $0.42, and 50% on strength above $0.60. High volatility expected; size accordingly.',
          invalidation: 0.32,
          timeHorizon: 'LONG_TERM',
          target1: 1.2,
          target2: 2.0,
          target3: 3.5,
          catalysts: JSON.stringify([
            'AI ecosystem integrations',
            'Broader AI narrative strength',
            'Exchange and partnership headlines'
          ]),
          risks: JSON.stringify([
            'Narrative fade',
            'High-beta drawdowns',
            'Competition from alternative AI tokens'
          ]),
          confidenceScore: 75,
          status: 'WATCHING'
        }
      ]
    });
  }

  /**
   * Generate Alpha Picks from live market data using AI research
   * This finds real opportunities and generates research reports
   */
  async generateFromLiveMarket(): Promise<{ created: number; picks: any[] }> {
    console.log('[AlphaPicks] Scanning live market for opportunities...');
    
    // Find opportunities based on market criteria
    const opportunities = await marketDataService.findOpportunities();
    console.log(`[AlphaPicks] Found ${opportunities.length} potential opportunities`);
    
    const createdPicks = [];
    
    for (const coin of opportunities.slice(0, 5)) {
      try {
        // Generate AI research report
        const report = await aiResearchService.generateResearch(coin.id, coin);
        
        if (!report) {
          console.log(`[AlphaPicks] Skipping ${coin.name} - could not generate report`);
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
          console.log(`[AlphaPicks] Updated existing pick: ${report.coinName}`);
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
          console.log(`[AlphaPicks] Created new pick: ${report.coinName} (${report.ticker})`);
        }
      } catch (error) {
        console.error(`[AlphaPicks] Error processing ${coin.name}:`, error);
      }
    }
    
    return { created: createdPicks.length, picks: createdPicks };
  }
}

export const alphaPicksService = new AlphaPicksService();
