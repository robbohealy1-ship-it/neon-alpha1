import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export interface SignalData {
  coin: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  strategy?: string;
  timeframe?: string;
}

export interface SignalPerformance {
  totalSignals: number;
  wins: number;
  losses: number;
  activeSignals: number;
  winRate: number;
  averageRR: number;
  totalPnlPercent: number;
}

class SignalTrackerService {
  // Save a new signal when generated
  async saveSignal(signal: SignalData) {
    try {
      const saved = await prisma.signalHistory.create({
        data: {
          coin: signal.coin,
          direction: signal.direction,
          entry: signal.entry,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          confidence: signal.confidence,
          result: 'ACTIVE',
          strategy: signal.strategy || 'EMA Trend Pullback',
          timeframe: signal.timeframe || '1h',
        },
      });
      console.log(`✅ Signal saved: ${signal.coin} ${signal.direction} @ ${signal.entry}`);
      return saved;
    } catch (error) {
      console.error('Error saving signal:', error);
      throw error;
    }
  }

  // Check all active signals against current market prices
  async checkActiveSignals() {
    try {
      // Use the main Signal model (not SignalHistory) for consistency
      const activeSignals = await prisma.signal.findMany({
        where: { status: { in: ['ACTIVE', 'TRIGGERED'] } },
      });

      console.log(`[SignalTracker] Checking ${activeSignals.length} active signals...`);

      for (const signal of activeSignals) {
        await this.checkSignalResult(signal);
      }
    } catch (error) {
      console.error('[SignalTracker] Error checking active signals:', error);
    }
  }

  // Check if a signal has hit TP or SL
  private async checkSignalResult(signal: any) {
    try {
      // Get current price from CoinGecko
      const symbol = signal.coin.replace('USDT', '').toLowerCase();
      const coinGeckoId = this.getCoinGeckoId(symbol);
      
      if (!coinGeckoId) {
        console.warn(`Unknown coin: ${signal.coin}`);
        return;
      }

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
        { timeout: 5000 }
      );

      const currentPrice = response.data[coinGeckoId]?.usd;
      if (!currentPrice) {
        console.warn(`No price data for ${signal.coin}`);
        return;
      }

      const { status, pnlPercent } = this.calculateResult(signal, currentPrice);

      if (status !== 'ACTIVE') {
        await this.closeSignal(signal.id, status, currentPrice, pnlPercent);
      }
    } catch (error) {
      console.error(`Error checking signal ${signal.id}:`, error);
    }
  }

  // Calculate if signal hit TP or SL using Signal model fields
  private calculateResult(signal: any, currentPrice: number): { status: string; pnlPercent: number } {
    const { direction, entryPrice, stopLoss, target1 } = signal;
    const entry = entryPrice || (signal.entryMin + signal.entryMax) / 2 || currentPrice;
    const takeProfit = target1 || currentPrice * 1.05;

    if (direction === 'LONG') {
      // For LONG: TP is above entry, SL is below entry
      if (currentPrice >= takeProfit) {
        const pnl = ((takeProfit - entry) / entry) * 100;
        return { status: 'SUCCESS', pnlPercent: pnl };
      }
      if (currentPrice <= stopLoss) {
        const pnl = ((stopLoss - entry) / entry) * 100;
        return { status: 'FAILED', pnlPercent: pnl };
      }
    } else {
      // For SHORT: TP is below entry, SL is above entry
      if (currentPrice <= takeProfit) {
        const pnl = ((entry - takeProfit) / entry) * 100;
        return { status: 'SUCCESS', pnlPercent: pnl };
      }
      if (currentPrice >= stopLoss) {
        const pnl = ((entry - stopLoss) / entry) * 100;
        return { status: 'FAILED', pnlPercent: -pnl };
      }
    }

    return { status: 'ACTIVE', pnlPercent: 0 };
  }

  // Close a signal with result using Signal model
  private async closeSignal(id: string, status: string, exitPrice: number, pnlPercent: number) {
    try {
      await prisma.signal.update({
        where: { id },
        data: {
          status,
          exitPrice,
          pnlPercent,
        },
      });
      console.log(`[SignalTracker] Signal ${id} closed: ${status} @ $${exitPrice.toFixed(4)} (${pnlPercent.toFixed(2)}%)`);
    } catch (error) {
      console.error(`[SignalTracker] Error closing signal ${id}:`, error);
    }
  }

  // Get signal performance metrics using Signal model
  async getPerformanceMetrics(): Promise<SignalPerformance> {
    try {
      const allSignals = await prisma.signal.findMany();
      
      const wins = allSignals.filter(s => s.status === 'SUCCESS').length;
      const losses = allSignals.filter(s => s.status === 'FAILED').length;
      const activeSignals = allSignals.filter(s => ['FORMING', 'ACTIVE', 'TRIGGERED'].includes(s.status)).length;
      const completedSignals = wins + losses;

      const winRate = completedSignals > 0 ? (wins / completedSignals) * 100 : 0;

      // Calculate average risk/reward
      const completed = allSignals.filter(s => s.status === 'SUCCESS' || s.status === 'FAILED');
      const averageRR = completed.length > 0
        ? completed.reduce((sum, s) => sum + (s.pnlPercent || 0), 0) / completed.length
        : 0;

      // Calculate total PnL
      const totalPnlPercent = allSignals.reduce((sum, s) => sum + (s.pnlPercent || 0), 0);

      return {
        totalSignals: allSignals.length,
        wins,
        losses,
        activeSignals,
        winRate,
        averageRR,
        totalPnlPercent,
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  // Get recent signals using Signal model
  async getRecentSignals(limit: number = 20) {
    try {
      return await prisma.signal.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Error getting recent signals:', error);
      throw error;
    }
  }

  // Get signal stats by coin
  async getStatsByCoin() {
    try {
      const signals = await prisma.signalHistory.findMany({
        where: {
          result: { in: ['WIN', 'LOSS'] },
        },
      });

      const coinStats: Record<string, { wins: number; losses: number; total: number }> = {};

      for (const signal of signals) {
        if (!coinStats[signal.coin]) {
          coinStats[signal.coin] = { wins: 0, losses: 0, total: 0 };
        }
        coinStats[signal.coin].total++;
        if (signal.result === 'WIN') {
          coinStats[signal.coin].wins++;
        } else {
          coinStats[signal.coin].losses++;
        }
      }

      return Object.entries(coinStats)
        .map(([coin, stats]) => ({
          coin,
          ...stats,
          winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error getting coin stats:', error);
      throw error;
    }
  }

  // Map common symbols to CoinGecko IDs
  private getCoinGeckoId(symbol: string): string | null {
    const mapping: Record<string, string> = {
      btc: 'bitcoin',
      eth: 'ethereum',
      sol: 'solana',
      bnb: 'binancecoin',
      xrp: 'ripple',
      ada: 'cardano',
      doge: 'dogecoin',
      dot: 'polkadot',
      matic: 'polygon',
      link: 'chainlink',
      avax: 'avalanche-2',
      uni: 'uniswap',
      ltc: 'litecoin',
      etc: 'ethereum-classic',
      xlm: 'stellar',
      atom: 'cosmos',
      algo: 'algorand',
      vet: 'vechain',
      fil: 'filecoin',
      trx: 'tron',
    };

    return mapping[symbol.toLowerCase()] || null;
  }
}

export const signalTrackerService = new SignalTrackerService();

// Start periodic signal checking (every 5 minutes)
export function startSignalChecker() {
  console.log('🚀 Signal checker started - checking every 5 minutes');
  
  // Check immediately on start
  signalTrackerService.checkActiveSignals();
  
  // Then every 5 minutes
  setInterval(() => {
    signalTrackerService.checkActiveSignals();
  }, 5 * 60 * 1000);
}
