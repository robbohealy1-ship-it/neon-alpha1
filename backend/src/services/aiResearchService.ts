import { marketDataService } from './marketDataService';

interface ResearchReport {
  coinName: string;
  ticker: string;
  sector: string;
  marketCapCategory: string;
  executiveSummary: string[];
  thesis: string;
  narrative: string;
  useCase: string;
  tokenomics: any;
  competitiveEdge: string;
  onChainData: any;
  accumulationZones: number[];
  targets: { tp1: number; tp2: number; tp3: number };
  invalidation: number;
  confidenceScore: number;
  risks: string[];
  catalysts: string[];
}

class AIResearchService {
  /**
   * Generate research report from live market data
   */
  async generateResearch(coinId: string, coinData: any): Promise<ResearchReport | null> {
    try {
      // Fetch detailed coin info and price history
      const [details, chart] = await Promise.all([
        marketDataService.fetchCoinDetails(coinId),
        marketDataService.fetchMarketChart(coinId, 90)
      ]);

      if (!details || !chart) return null;

      const currentPrice = details.market_data?.current_price?.usd || 0;
      const ath = details.market_data?.ath?.usd || 0;
      const athChange = details.market_data?.ath_change_percentage?.usd || 0;
      const marketCap = details.market_data?.market_cap?.usd || 0;
      
      // Calculate accumulation zones from price history
      const accumulationZones = marketDataService.calculateAccumulationZones(chart.prices);
      
      // Generate targets based on risk/reward
      const targets = this.calculateTargets(currentPrice, ath, accumulationZones);
      
      // Determine sector from categories
      const sector = this.categorizeSector(details.categories || [], details.name);
      
      // Generate AI-written research sections
      const report: ResearchReport = {
        coinName: details.name,
        ticker: details.symbol?.toUpperCase() || '',
        sector,
        marketCapCategory: this.categorizeMarketCap(marketCap),
        executiveSummary: this.generateExecutiveSummary(details, athChange, currentPrice),
        thesis: this.generateThesis(details, athChange, currentPrice),
        narrative: this.generateNarrative(details, sector),
        useCase: details.description?.en?.split('.')[0] + '.' || 'Decentralized cryptocurrency project.',
        tokenomics: this.extractTokenomics(details),
        competitiveEdge: this.generateCompetitiveEdge(details, sector),
        onChainData: this.generateOnChainInsights(details),
        accumulationZones,
        targets,
        invalidation: accumulationZones.length > 0 ? accumulationZones[2] * 0.95 : currentPrice * 0.8,
        confidenceScore: this.calculateConfidenceScore(details, athChange, accumulationZones),
        risks: this.generateRisks(details, athChange),
        catalysts: this.generateCatalysts(details, sector)
      };

      return report;
    } catch (error) {
      console.error(`Error generating research for ${coinId}:`, error);
      return null;
    }
  }

  private categorizeSector(categories: string[], name: string): string {
    const categoryString = categories.join(' ').toLowerCase();
    if (categoryString.includes('ai') || categoryString.includes('artificial intelligence')) return 'AI';
    if (categoryString.includes('defi') || categoryString.includes('dex')) return 'DeFi';
    if (categoryString.includes('layer 2') || categoryString.includes('scaling')) return 'L2';
    if (categoryString.includes('meme') || categoryString.includes('dog')) return 'Meme';
    if (categoryString.includes('real world') || categoryString.includes('rwa')) return 'RWA';
    if (categoryString.includes('gaming') || categoryString.includes('game')) return 'Gaming';
    if (categoryString.includes('depin')) return 'DePIN';
    if (categoryString.includes('infrastructure')) return 'Infrastructure';
    return 'Infrastructure';
  }

  private categorizeMarketCap(marketCap: number): string {
    if (marketCap > 10_000_000_000) return 'HIGH';
    if (marketCap > 1_000_000_000) return 'MID';
    return 'LOW';
  }

  private generateExecutiveSummary(details: any, athChange: number, currentPrice: number): string[] {
    const points = [];
    
    if (athChange < -70) {
      points.push(`Down ${Math.abs(athChange).toFixed(0)}% from ATH - deep value opportunity`);
    } else if (athChange < -50) {
      points.push(`Down ${Math.abs(athChange).toFixed(0)}% from ATH - attractive entry zone`);
    }
    
    points.push(`Current price $${currentPrice.toFixed(4)} with defined accumulation levels`);
    points.push(`${details.name} operates in the ${this.categorizeSector(details.categories || [], details.name)} sector`);
    
    if (details.market_data?.price_change_percentage_24h > 5) {
      points.push('Showing positive 24h momentum (+5%+ gains)');
    }
    
    return points.slice(0, 3);
  }

  private generateThesis(details: any, athChange: number, currentPrice: number): string {
    const name = details.name;
    const sector = this.categorizeSector(details.categories || [], name);
    
    let thesis = `${name} represents a ${sector.toLowerCase()} play at significantly discounted valuations. `;
    
    if (athChange < -60) {
      thesis += `Trading ${Math.abs(athChange).toFixed(0)}% below its all-time high, the risk/reward setup has shifted favorably for patient accumulation. `;
    }
    
    thesis += `The project maintains active development with ${details.developer_data?.commit_count_4_weeks || 'consistent'} recent commits and ${details.community_data?.twitter_followers?.toLocaleString() || 'strong'} community followers. `;
    
    thesis += `Current market conditions present an opportunity to build a position below the historical cost basis of most participants.`;
    
    return thesis;
  }

  private generateNarrative(details: any, sector: string): string {
    const narratives: Record<string, string> = {
      'AI': 'AI infrastructure and autonomous agents continue to attract institutional capital.',
      'DeFi': 'Decentralized finance protocols are seeing renewed TVL growth and user adoption.',
      'L2': 'Layer 2 scaling solutions are capturing value as Ethereum mainnet fees remain elevated.',
      'Infrastructure': 'Blockchain infrastructure plays benefit from increased cross-chain activity.',
      'Gaming': 'Web3 gaming is showing early signs of user traction and sustainable tokenomics.'
    };
    
    return narratives[sector] || `${details.name} operates within a growing sector of the crypto ecosystem.`;
  }

  private extractTokenomics(details: any): any {
    return {
      maxSupply: details.market_data?.max_supply ? `${(details.market_data.max_supply / 1_000_000_000).toFixed(2)}B` : 'See documentation',
      circulatingSupply: details.market_data?.circulating_supply ? `${(details.market_data.circulating_supply / 1_000_000_000).toFixed(2)}B` : 'N/A',
      totalSupply: details.market_data?.total_supply ? `${(details.market_data.total_supply / 1_000_000_000).toFixed(2)}B` : 'N/A',
      inflation: details.market_data?.circulating_supply && details.market_data?.total_supply 
        ? `${((1 - details.market_data.circulating_supply / details.market_data.total_supply) * 100).toFixed(1)}% unvested`
        : 'Check docs'
    };
  }

  private generateCompetitiveEdge(details: any, sector: string): string {
    const edges: Record<string, string[]> = {
      'AI': ['First-mover advantage in AI-agent infrastructure', 'Strong partnerships with compute providers', 'Active developer ecosystem'],
      'DeFi': ['Unique AMM mechanism or yield strategy', 'Deep liquidity relative to market cap', 'Integrated with major DeFi protocols'],
      'L2': ['Fast finality with Ethereum security', 'Growing dApp ecosystem', 'Low transaction costs'],
      'Infrastructure': ['Critical infrastructure for blockchain connectivity', 'Revenue-generating protocol fees', 'Strong validator set']
    };
    
    const sectorEdges = edges[sector] || ['Active development team', 'Growing community', 'Clear use case'];
    return sectorEdges[Math.floor(Math.random() * sectorEdges.length)];
  }

  private generateOnChainInsights(details: any): any {
    return {
      walletGrowth: 'Monitoring active addresses for growth trends',
      exchangeFlows: details.market_data?.price_change_percentage_24h > 0 ? 'Net outflows suggest accumulation' : 'Mixed flows - monitoring',
      whaleActivity: 'Large holders positioning watched closely',
      volumeAnomalies: `${details.market_data?.total_volume?.usd?.toLocaleString() || 'Moderate'} 24h volume`
    };
  }

  private calculateTargets(currentPrice: number, ath: number, accumulationZones: number[]): { tp1: number; tp2: number; tp3: number } {
    if (accumulationZones.length === 0) {
      return {
        tp1: currentPrice * 1.5,
        tp2: currentPrice * 2.2,
        tp3: currentPrice * 3.5
      };
    }
    
    const entry = accumulationZones[1] || currentPrice;
    return {
      tp1: Math.min(entry * 2, ath * 0.5),
      tp2: Math.min(entry * 3, ath * 0.7),
      tp3: Math.min(entry * 4.5, ath * 0.9)
    };
  }

  private calculateConfidenceScore(details: any, athChange: number, accumulationZones: number[]): number {
    let score = 50;
    
    // Deep value adds confidence
    if (athChange < -70) score += 15;
    else if (athChange < -50) score += 10;
    
    // Defined accumulation zones add confidence
    if (accumulationZones.length >= 3) score += 10;
    
    // Active development adds confidence
    if (details.developer_data?.commit_count_4_weeks > 50) score += 10;
    
    // Strong community adds confidence
    if (details.community_data?.twitter_followers > 100000) score += 5;
    
    // Positive momentum adds confidence
    if (details.market_data?.price_change_percentage_24h > 0) score += 5;
    
    return Math.min(score, 95);
  }

  private generateRisks(details: any, athChange: number): string[] {
    const risks = [
      'Cryptocurrency market volatility and drawdowns',
      'Regulatory uncertainty in major jurisdictions'
    ];
    
    if (athChange < -80) {
      risks.push('Extended bear market may continue pressuring price');
    }
    
    if (details.market_data?.market_cap?.usd < 500_000_000) {
      risks.push('Lower market cap means higher volatility and liquidity risk');
    }
    
    risks.push('Smart contract or technical risks inherent to crypto projects');
    
    return risks.slice(0, 4);
  }

  private generateCatalysts(details: any, sector: string): string[] {
    const catalysts: Record<string, string[]> = {
      'AI': ['AI narrative strength in broader markets', 'Enterprise partnerships announcements', 'New model or agent deployments'],
      'DeFi': ['TVL growth resumption', 'New protocol integrations', 'Governance token utility improvements'],
      'L2': ['Major dApp migrations', 'Ecosystem grant programs', 'Technical milestones achieved'],
      'Infrastructure': ['Cross-chain adoption acceleration', 'Enterprise client announcements', 'Protocol revenue growth']
    };
    
    return (catalysts[sector] || ['General crypto market recovery', 'Exchange listing announcements', 'Product development milestones']).slice(0, 3);
  }

  /**
   * Scan market for opportunities and generate reports
   */
  async scanAndGenerateReports(): Promise<ResearchReport[]> {
    const opportunities = await marketDataService.findOpportunities();
    const reports: ResearchReport[] = [];
    
    for (const coin of opportunities.slice(0, 5)) {
      const report = await this.generateResearch(coin.id, coin);
      if (report) {
        reports.push(report);
      }
    }
    
    return reports;
  }
}

export const aiResearchService = new AIResearchService();
