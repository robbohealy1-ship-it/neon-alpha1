import api from '../lib/api';

export interface SignalPerformanceMetrics {
  totalSignals: number;
  wins: number;
  losses: number;
  activeSignals: number;
  winRate: number;
  averageRR: number;
  totalPnlPercent: number;
}

export interface SignalHistory {
  id: string;
  coin: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  result: 'WIN' | 'LOSS' | 'ACTIVE';
  confidence: number;
  createdAt: string;
  closedAt?: string;
  pnlPercent?: number;
  strategy?: string;
  timeframe?: string;
}

export interface CoinStats {
  coin: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

class SignalPerformanceService {
  async getMetrics(): Promise<SignalPerformanceMetrics | null> {
    try {
      const { data } = await api.get('/signal-performance/metrics');
      // Check if data has the expected structure
      if (!data || data.error || typeof data.totalSignals !== 'number') {
        return null;
      }
      return data;
    } catch (error) {
      console.error('Failed to get signal metrics:', error);
      return null;
    }
  }

  async getRecentSignals(limit: number = 20): Promise<SignalHistory[]> {
    try {
      const { data } = await api.get(`/signal-performance/recent?limit=${limit}`);
      if (!data || data.error || !Array.isArray(data)) {
        return [];
      }
      return data;
    } catch (error) {
      console.error('Failed to get recent signals:', error);
      return [];
    }
  }

  async getStatsByCoin(): Promise<CoinStats[]> {
    try {
      const { data } = await api.get('/signal-performance/by-coin');
      if (!data || data.error || !Array.isArray(data)) {
        return [];
      }
      return data;
    } catch (error) {
      console.error('Failed to get coin stats:', error);
      return [];
    }
  }
}

export const signalPerformanceService = new SignalPerformanceService();
