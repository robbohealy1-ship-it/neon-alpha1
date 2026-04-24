import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
}

interface GemAnalysis {
  ticker: string;
  coinName: string;
  sector: string;
  marketCapCategory: 'LOW' | 'MID' | 'HIGH';
  confidenceScore: number;
  status: 'ACCUMULATING' | 'WATCHING' | 'COMPLETED';
  thesis: string;
  narrative: string;
  executiveSummary: string[];
  onChainData: any;
  marketStructure: string;
  accumulationZones: number[];
  catalysts: string[];
  risks: string[];
  target1: number;
  target2: number;
  target3: number;
  hype?: string;
}

// Low-cap gem categories with hype potential
const GEM_SECTORS = [
  { id: 'meme', keywords: ['doge', 'pepe', 'shib', 'floki', 'bonk', 'wojak', 'turbo', 'mog'], sector: 'Meme', description: 'Community-driven meme tokens with viral potential' },
  { id: 'ai', keywords: ['ai', 'gpt', 'agent', 'brain', 'neural', 'intelligence', 'fetch', 'bittensor', 'render'], sector: 'AI', description: 'Artificial intelligence and machine learning protocols' },
  { id: 'depin', keywords: ['depin', 'io', 'render', 'helium', 'hivemapper', 'wifi'], sector: 'DePIN', description: 'Decentralized physical infrastructure networks' },
  { id: 'gaming', keywords: ['game', 'gaming', 'play', 'metaverse', 'p2e', 'nft'], sector: 'Gaming', description: 'Blockchain gaming and metaverse projects' },
  { id: 'rwa', keywords: ['real', 'estate', 'gold', 'tokenized', 'asset'], sector: 'RWA', description: 'Real world asset tokenization' },
  { id: 'defi', keywords: ['swap', 'dex', 'yield', 'lending', 'perp', 'option'], sector: 'DeFi', description: 'Decentralized finance protocols' }
];

// High-potential low-cap gems to track (manually curated for now, can be expanded)
const HOT_GEMS = [
  { ticker: 'BONK', name: 'Bonk', sector: 'Meme', hype: 'Solana ecosystem, viral community, dog-themed' },
  { ticker: 'PEPE', name: 'Pepe', sector: 'Meme', hype: 'Ethereum meme, massive community, cultural phenomenon' },
  { ticker: 'WIF', name: 'dogwifhat', sector: 'Meme', hype: 'Solana meme, viral hat memes, strong community' },
  { ticker: 'POPCAT', name: 'Popcat', sector: 'Meme', hype: 'Solana cat meme, viral internet culture' },
  { ticker: 'MOG', name: 'Mog Coin', sector: 'Meme', hype: 'Ethereum meme, edgy community, viral memes' },
  { ticker: 'FET', name: 'Fetch.ai', sector: 'AI', hype: 'AI agents, autonomous economy, narrative strength' },
  { ticker: 'RENDER', name: 'Render Network', sector: 'AI', hype: 'GPU rendering, AI compute, infrastructure play' },
  { ticker: 'TAO', name: 'Bittensor', sector: 'AI', hype: 'Decentralized AI training, high conviction play' },
  { ticker: 'IO', name: 'IO.net', sector: 'DePIN', hype: 'GPU clusters, AI compute, Solana integration' },
  { ticker: 'HNT', name: 'Helium', sector: 'DePIN', hype: 'Decentralized wireless, IoT, real world utility' },
  { ticker: 'IMX', name: 'Immutable X', sector: 'Gaming', hype: 'NFT gaming, Layer 2 for games, big partnerships' },
  { ticker: 'BEAM', name: 'Beam', sector: 'Gaming', hype: 'Gaming-focused chain, Merit Circle backing' },
  { ticker: 'PYTH', name: 'Pyth Network', sector: 'Infrastructure', hype: 'Oracle network, institutional data, fast finality' },
  { ticker: 'JUP', name: 'Jupiter', sector: 'DeFi', hype: 'Solana DEX aggregator, massive volume, community' },
  { ticker: 'JTO', name: 'Jito', sector: 'Infrastructure', hype: 'Solana MEV, liquid staking, high yield' },
  { ticker: 'WLD', name: 'Worldcoin', sector: 'AI', hype: 'Sam Altman, human identity, controversial but high attention' },
  { ticker: 'ARKM', name: 'Arkham', sector: 'Infrastructure', hype: 'On-chain intelligence, crypto analytics, AI powered' },
  { ticker: 'SEI', name: 'Sei', sector: 'Infrastructure', hype: 'Fastest L1, trading optimized, parallel EVM' },
  { ticker: 'SUI', name: 'Sui', sector: 'Infrastructure', hype: 'Move language, parallel execution, gaming focus' },
  { ticker: 'APT', name: 'Aptos', sector: 'Infrastructure', hype: 'Meta blockchain engineers, Move language' }
];

export class LowCapGemScanner {
  private lastScanTime: Date | null = null;
  private isScanning = false;

  /**
   * Scan for low-cap gems with community hype
   */
  async scanForGems(): Promise<{ created: number; gems: GemAnalysis[] }> {
    if (this.isScanning) {
      console.log('[GemScanner] Scan already in progress');
      return { created: 0, gems: [] };
    }

    this.isScanning = true;
    console.log('[GemScanner] Starting low-cap gem scan...');

    try {
      // Fetch market data for hot gems
      const coins = HOT_GEMS.map(g => g.ticker.toLowerCase()).join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            ids: coins,
            order: 'market_cap_asc',
            per_page: 50,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h,7d,30d'
          },
          timeout: 15000
        }
      );

      const marketData: CoinData[] = response.data;
      const gems: GemAnalysis[] = [];

      for (const coin of marketData) {
        const gem = await this.analyzeGem(coin);
        if (gem) {
          gems.push(gem);
        }
      }

      // Sort by confidence score and take top picks
      gems.sort((a, b) => b.confidenceScore - a.confidenceScore);
      const topGems = gems.slice(0, 5); // Generate 3-5 picks

      // Save to database
      let created = 0;
      for (const gem of topGems) {
        try {
          // Check if pick already exists
          const existing = await prisma.alphaPick.findFirst({
            where: { ticker: gem.ticker },
            orderBy: { createdAt: 'desc' }
          });

          // Only create new if none exists or older than 3 days
          if (!existing || Date.now() - existing.createdAt.getTime() > 3 * 24 * 60 * 60 * 1000) {
            await this.saveGemToDatabase(gem);
            created++;
            console.log(`[GemScanner] Created Alpha Pick: ${gem.ticker} (${gem.coinName})`);
          }
        } catch (err) {
          console.error(`[GemScanner] Error saving ${gem.ticker}:`, err);
        }
      }

      this.lastScanTime = new Date();
      console.log(`[GemScanner] Scan complete. Created ${created} new Alpha Picks.`);

      return { created, gems: topGems };
    } catch (error) {
      console.error('[GemScanner] Scan error:', error);
      return { created: 0, gems: [] };
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Analyze a single coin for gem potential
   */
  private async analyzeGem(coin: CoinData): Promise<GemAnalysis | null> {
    const hotGem = HOT_GEMS.find(g => g.ticker.toLowerCase() === coin.symbol.toUpperCase());
    if (!hotGem) return null;

    const mc = coin.market_cap || 0;
    const category = mc < 500000000 ? 'LOW' : mc < 2000000000 ? 'MID' : 'HIGH';
    
    // Skip if already too large (>$5B) unless exceptional
    if (mc > 5000000000 && coin.price_change_percentage_30d < 50) {
      return null;
    }

    // Calculate hype score
    const volumeScore = Math.min(coin.total_volume / (mc * 0.1), 1) * 25; // High volume relative to MC
    const momentumScore = Math.min(Math.max(coin.price_change_percentage_7d || 0, 0) / 100, 1) * 25;
    const recoveryScore = Math.min(Math.abs(coin.ath_change_percentage || 0) / 80, 1) * 25; // Distance from ATH
    const communityScore = hotGem.hype.includes('community') || hotGem.hype.includes('viral') ? 25 : 15;

    const confidenceScore = Math.round(volumeScore + momentumScore + recoveryScore + communityScore);

    // Generate dynamic analysis
    const currentPrice = coin.current_price;
    const ath = coin.ath || currentPrice * 2;
    const support1 = currentPrice * 0.85;
    const support2 = currentPrice * 0.70;
    const support3 = currentPrice * 0.55;

    const target1 = ath * 0.5;
    const target2 = ath * 0.8;
    const target3 = ath;

    const marketStructure = coin.price_change_percentage_7d > 20 ? 'bullish' : 
                           coin.price_change_percentage_24h > 5 ? 'accumulating' : 'neutral';

    const status: 'ACCUMULATING' | 'WATCHING' | 'COMPLETED' = 
      marketStructure === 'bullish' ? 'ACCUMULATING' : 'WATCHING';

    // Generate thesis based on coin characteristics
    const thesis = this.generateThesis(hotGem, coin, category);
    const narrative = this.generateNarrative(hotGem, coin);
    const catalysts = this.generateCatalysts(hotGem, coin);
    const risks = this.generateRisks(hotGem, coin);
    const executiveSummary = this.generateSummary(hotGem, coin, confidenceScore);

    return {
      ticker: hotGem.ticker,
      coinName: hotGem.name,
      sector: hotGem.sector,
      marketCapCategory: category,
      confidenceScore: Math.min(confidenceScore, 98),
      status,
      thesis,
      narrative,
      executiveSummary,
      onChainData: {
        volume24h: coin.total_volume,
        volumeTrend: coin.price_change_percentage_24h > 0 ? 'increasing' : 'decreasing',
        marketCapRank: coin.market_cap_rank,
        priceVsATH: coin.ath_change_percentage,
        supplyPressure: coin.circulating_supply / (coin.total_supply || coin.circulating_supply)
      },
      marketStructure,
      accumulationZones: [support1, support2, support3],
      catalysts,
      risks,
      target1,
      target2,
      target3
    };
  }

  private generateThesis(gem: typeof HOT_GEMS[0], coin: CoinData, category: string): string {
    const mc = (coin.market_cap / 1000000).toFixed(0);
    const sectorDesc = GEM_SECTORS.find(s => s.id === gem.sector.toLowerCase())?.description || gem.sector;
    
    return `${gem.name} (${gem.ticker}) is a ${category.toLowerCase()}-cap ${sectorDesc.toLowerCase()} ` +
           `project currently trading at $${coin.current_price.toFixed(4)} with a ${mc}M market cap. ` +
           `${gem.hype.split(',')[0]}. The 7-day momentum of ${(coin.price_change_percentage_7d || 0).toFixed(1)}% ` +
           `suggests ${coin.price_change_percentage_7d > 0 ? 'growing' : 'stable'} community interest. ` +
           `Current accumulation zones present a ${coin.ath_change_percentage && Math.abs(coin.ath_change_percentage) > 70 ? 'high-conviction entry' : 'reasonable entry'} ` +
           `for risk-tolerant investors seeking ${category === 'LOW' ? 'asymmetric upside' : 'steady growth'} exposure.`;
  }

  private generateNarrative(gem: typeof HOT_GEMS[0], coin: CoinData): string {
    const hypeParts = gem.hype.split(',').slice(0, 3);
    return `${gem.sector} narratives are rotating, and ${gem.name} sits at the intersection of ` +
           `${hypeParts.join(' and ')}. With ${(coin.total_volume / 1000000).toFixed(1)}M daily volume ` +
           `and ${Math.abs(coin.ath_change_percentage || 0).toFixed(0)}% from ATH, ` +
           `the risk/reward setup ${coin.ath_change_percentage && Math.abs(coin.ath_change_percentage) > 80 ? 'looks compelling' : 'warrants attention'} ` +
           `for position sizing. Community sentiment remains ${coin.price_change_percentage_24h > 0 ? 'constructive' : 'mixed'} on social channels.`;
  }

  private generateSummary(gem: typeof HOT_GEMS[0], coin: CoinData, confidence: number): string[] {
    const summaries = [
      `${gem.sector} narrative gaining traction with ${gem.hype.split(',')[0].toLowerCase()}`,
      `${(coin.price_change_percentage_7d || 0).toFixed(0)}% weekly momentum suggests ${coin.price_change_percentage_7d > 20 ? 'strong accumulation' : 'early positioning'}`,
      confidence > 70 ? 'High community conviction and viral potential' : 'Moderate conviction, watch for breakout',
      `Entry zones offer ${coin.ath_change_percentage && Math.abs(coin.ath_change_percentage) > 80 ? 'asymmetric' : 'reasonable'} risk/reward at current levels`
    ];
    return summaries;
  }

  private generateCatalysts(gem: typeof HOT_GEMS[0], coin: CoinData): string[] {
    const catalysts = [];
    if (gem.sector === 'Meme') {
      catalysts.push('Viral social media moments and community raids');
      catalysts.push('Exchange listings and meme coin seasonality');
    } else if (gem.sector === 'AI') {
      catalysts.push('AI narrative strength and enterprise adoption');
      catalysts.push('Product launches and partnership announcements');
    } else if (gem.sector === 'DePIN') {
      catalysts.push('Infrastructure growth and real-world adoption');
      catalysts.push('Hardware deployments and network expansion');
    }
    catalysts.push(`${gem.sector} sector rotation and capital inflows`);
    catalysts.push('Broader crypto market recovery and altcoin season');
    return catalysts;
  }

  private generateRisks(gem: typeof HOT_GEMS[0], coin: CoinData): string[] {
    const risks = ['Broader crypto market weakness and drawdowns'];
    if (gem.sector === 'Meme') {
      risks.push('Meme narrative rotation and community abandonment');
      risks.push('High volatility and speculative risk');
    } else {
      risks.push('Competition from established protocols');
      risks.push('Execution risk and product delays');
    }
    risks.push('Regulatory uncertainty in crypto markets');
    if (coin.ath_change_percentage && Math.abs(coin.ath_change_percentage) < 30) {
      risks.push('Limited upside from current price levels');
    }
    return risks;
  }

  /**
   * Save gem analysis to database
   */
  private async saveGemToDatabase(gem: GemAnalysis): Promise<void> {
    await prisma.alphaPick.create({
      data: {
        coinName: gem.coinName,
        ticker: gem.ticker,
        sector: gem.sector,
        marketCapCategory: gem.marketCapCategory,
        executiveSummary: JSON.stringify(gem.executiveSummary),
        thesis: gem.thesis,
        narrative: gem.narrative,
        useCase: `${gem.sector} protocol with ${gem.hype || 'strong community'} focus`,
        tokenomics: JSON.stringify({
          marketCap: gem.marketCapCategory,
          supplyType: 'circulating',
          unlockStatus: 'check vesting schedule'
        }),
        teamInvestors: JSON.stringify({
          backers: ['Community driven', 'Strategic investors'],
          ecosystem: gem.sector
        }),
        competitiveEdge: gem.narrative.substring(0, 200),
        onChainData: JSON.stringify(gem.onChainData),
        marketStructure: gem.marketStructure,
        accumulationZones: JSON.stringify(gem.accumulationZones),
        liquidityAreas: JSON.stringify({
          demandZones: gem.accumulationZones.map(z => `$${z.toFixed(2)}-$${(z * 1.05).toFixed(2)}`),
          structure: `${gem.marketStructure} momentum`
        }),
        executionPlan: `Scale into ${gem.ticker} at accumulation zones. Target 1: ${gem.target1.toFixed(2)}, Target 2: ${gem.target2.toFixed(2)}, Target 3: ${gem.target3.toFixed(2)}. Maintain strict invalidation below lowest accumulation zone.`,
        invalidation: gem.accumulationZones[gem.accumulationZones.length - 1] * 0.95,
        timeHorizon: gem.marketCapCategory === 'LOW' ? 'SWING' : 'POSITION',
        target1: gem.target1,
        target2: gem.target2,
        target3: gem.target3,
        catalysts: JSON.stringify(gem.catalysts),
        risks: JSON.stringify(gem.risks),
        confidenceScore: gem.confidenceScore,
        status: gem.status
      }
    });
  }

  /**
   * Start daily scanning (every 24 hours)
   */
  startDailyScan(): void {
    console.log('[GemScanner] Starting daily low-cap gem scanner...');
    
    // Run immediately on startup
    this.scanForGems().catch(console.error);
    
    // Schedule daily scans (24 hours = 86400000ms)
    setInterval(() => {
      this.scanForGems().catch(console.error);
    }, 24 * 60 * 60 * 1000);
    
    console.log('[GemScanner] Daily scans scheduled (every 24 hours)');
  }

  /**
   * Force scan now (for manual triggering)
   */
  async forceScan(): Promise<{ created: number; gems: GemAnalysis[] }> {
    console.log('[GemScanner] Force scan triggered');
    return this.scanForGems();
  }
}

export const lowCapGemScanner = new LowCapGemScanner();
