import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, Clock, Zap } from 'lucide-react';

// Local interfaces to avoid import issues
interface SignalPerformanceMetrics {
  totalSignals: number;
  wins: number;
  losses: number;
  activeSignals: number;
  winRate: number;
  averageRR: number;
  totalPnlPercent: number;
}

interface SignalHistory {
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

// Simple API call function with ultra-defensive error handling
const fetchMetrics = async (): Promise<SignalPerformanceMetrics | null> => {
  try {
    const response = await fetch('/api/signal-performance/metrics');
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data !== 'object') return null;
    // Ensure all required fields are numbers
    return {
      totalSignals: typeof data.totalSignals === 'number' ? data.totalSignals : 0,
      wins: typeof data.wins === 'number' ? data.wins : 0,
      losses: typeof data.losses === 'number' ? data.losses : 0,
      activeSignals: typeof data.activeSignals === 'number' ? data.activeSignals : 0,
      winRate: typeof data.winRate === 'number' ? data.winRate : 0,
      averageRR: typeof data.averageRR === 'number' ? data.averageRR : 0,
      totalPnlPercent: typeof data.totalPnlPercent === 'number' ? data.totalPnlPercent : 0,
    };
  } catch {
    return null;
  }
};

const fetchSignals = async (): Promise<SignalHistory[]> => {
  try {
    const response = await fetch('/api/signal-performance/recent?limit=20');
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
};

export default function SignalPerformanceDashboard() {
  const [metrics, setMetrics] = useState<SignalPerformanceMetrics | null>(null);
  const [recentSignals, setRecentSignals] = useState<SignalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [_hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsData, signalsData] = await Promise.all([
          fetchMetrics(),
          fetchSignals(),
        ]);
        setMetrics(metricsData);
        setRecentSignals(signalsData || []);
      } catch {
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <Activity className="w-5 h-5 animate-pulse" />
          Loading signal performance...
        </div>
      </div>
    );
  }

  // Show empty state if no metrics
  if (!metrics) {
    return (
      <div className="glass rounded-2xl p-8">
        <p className="text-gray-400 text-center">No signal data available</p>
      </div>
    );
  }

  // Use metrics directly with defaults
  const winRate = metrics.winRate ?? 0;
  const totalSignals = metrics.totalSignals ?? 0;
  const activeSignals = metrics.activeSignals ?? 0;
  const wins = metrics.wins ?? 0;
  const losses = metrics.losses ?? 0;
  const averageRR = metrics.averageRR ?? 0;
  const totalPnlPercent = metrics.totalPnlPercent ?? 0;

  const statCards = [
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: winRate >= 50 ? 'text-neon-green' : 'text-neon-yellow',
      bgColor: winRate >= 50 ? 'bg-neon-green/10' : 'bg-neon-yellow/10',
    },
    {
      label: 'Total Signals',
      value: totalSignals.toString(),
      icon: Zap,
      color: 'text-neon-cyan',
      bgColor: 'bg-neon-cyan/10',
    },
    {
      label: 'Active Signals',
      value: activeSignals.toString(),
      icon: Activity,
      color: 'text-neon-purple',
      bgColor: 'bg-neon-purple/10',
    },
    {
      label: 'Wins / Losses',
      value: `${wins} / ${losses}`,
      icon: BarChart3,
      color: 'text-neon-blue',
      bgColor: 'bg-neon-blue/10',
    },
    {
      label: 'Avg R:R',
      value: `${averageRR.toFixed(2)}x`,
      icon: TrendingUp,
      color: averageRR > 0 ? 'text-neon-green' : 'text-neon-red',
      bgColor: averageRR > 0 ? 'bg-neon-green/10' : 'bg-neon-red/10',
    },
    {
      label: 'Total PnL',
      value: `${totalPnlPercent >= 0 ? '+' : ''}${totalPnlPercent.toFixed(1)}%`,
      icon: TrendingDown,
      color: totalPnlPercent >= 0 ? 'text-neon-green' : 'text-neon-red',
      bgColor: totalPnlPercent >= 0 ? 'bg-neon-green/10' : 'bg-neon-red/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl p-4"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Signals Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-neon-cyan" />
            <h3 className="text-lg font-bold">Recent Signals</h3>
            <span className="text-sm text-gray-400">(Last 20)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Coin</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Direction</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Result</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">PnL %</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Confidence</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSignals.map((signal, index) => (
                <motion.tr
                  key={signal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-800/50 hover:bg-dark-700/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{signal.coin.replace('USDT', '')}</span>
                      <span className="text-xs text-gray-500">{signal.timeframe}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      signal.direction === 'LONG'
                        ? 'bg-neon-green/20 text-neon-green'
                        : 'bg-neon-red/20 text-neon-red'
                    }`}>
                      {signal.direction}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {signal.result === 'ACTIVE' ? (
                      <span className="flex items-center gap-1 text-neon-yellow">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Active
                      </span>
                    ) : signal.result === 'WIN' ? (
                      <span className="flex items-center gap-1 text-neon-green">
                        <TrendingUp className="w-4 h-4" />
                        WIN
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-neon-red">
                        <TrendingDown className="w-4 h-4" />
                        LOSS
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {signal.pnlPercent !== undefined ? (
                      <span className={`font-bold ${
                        signal.pnlPercent >= 0 ? 'text-neon-green' : 'text-neon-red'
                      }`}>
                        {signal.pnlPercent >= 0 ? '+' : ''}{signal.pnlPercent.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            signal.confidence >= 80
                              ? 'bg-neon-green'
                              : signal.confidence >= 60
                              ? 'bg-neon-yellow'
                              : 'bg-neon-red'
                          }`}
                          style={{ width: `${signal.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{signal.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {new Date(signal.createdAt).toLocaleDateString()} {' '}
                    {new Date(signal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentSignals.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No signals generated yet. Signals will appear here as they are generated.
          </div>
        )}
      </motion.div>
    </div>
  );
}
