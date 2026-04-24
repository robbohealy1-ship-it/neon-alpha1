import { motion } from 'framer-motion'
import { TrendingUp, Target, Percent, DollarSign, Activity } from 'lucide-react'

interface PortfolioStatsProps {
  trades: any[]
  marketData: { [key: string]: any }
}

export default function PortfolioStats({ trades, marketData }: PortfolioStatsProps) {
  // Calculate realized P&L (closed trades)
  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== null)
  const realizedPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  
  // Calculate unrealized P&L (open trades)
  const openTrades = trades.filter(t => t.status === 'open')
  const unrealizedPnL = openTrades.reduce((sum, trade) => {
    const currentPrice = marketData[trade.asset]?.price
    if (!currentPrice) return sum
    
    let pnl = 0
    if (trade.direction === 'long') {
      pnl = (currentPrice - trade.entry) * trade.size
    } else {
      pnl = (trade.entry - currentPrice) * trade.size
    }
    return sum + pnl
  }, 0)
  
  // Total invested (sum of entry values)
  const totalInvested = openTrades.reduce((sum, trade) => {
    return sum + (trade.entry * trade.size)
  }, 0)
  
  // Win/Loss stats
  const winningTrades = closedTrades.filter(t => t.pnl > 0)
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
  
  // Average return
  const avgReturn = closedTrades.length > 0 
    ? closedTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / closedTrades.length 
    : 0
  
  const stats = [
    {
      label: 'Total P&L',
      value: realizedPnL + unrealizedPnL,
      prefix: '$',
      icon: DollarSign,
      color: realizedPnL + unrealizedPnL >= 0 ? 'text-neon-green' : 'text-red-400',
      bgColor: realizedPnL + unrealizedPnL >= 0 ? 'bg-neon-green/10' : 'bg-red-400/10'
    },
    {
      label: 'Realized',
      value: realizedPnL,
      prefix: '$',
      icon: TrendingUp,
      color: realizedPnL >= 0 ? 'text-neon-green' : 'text-red-400',
      bgColor: realizedPnL >= 0 ? 'bg-neon-green/10' : 'bg-red-400/10'
    },
    {
      label: 'Unrealized',
      value: unrealizedPnL,
      prefix: '$',
      icon: Activity,
      color: unrealizedPnL >= 0 ? 'text-neon-cyan' : 'text-orange-400',
      bgColor: unrealizedPnL >= 0 ? 'bg-neon-cyan/10' : 'bg-orange-400/10'
    },
    {
      label: 'Win Rate',
      value: winRate,
      suffix: '%',
      icon: Target,
      color: winRate >= 50 ? 'text-neon-green' : 'text-yellow-400',
      bgColor: 'bg-neon-purple/10'
    },
    {
      label: 'Avg Return',
      value: avgReturn,
      suffix: '%',
      icon: Percent,
      color: avgReturn >= 0 ? 'text-neon-green' : 'text-red-400',
      bgColor: avgReturn >= 0 ? 'bg-neon-green/10' : 'bg-red-400/10'
    },
    {
      label: 'Total Invested',
      value: totalInvested,
      prefix: '$',
      icon: DollarSign,
      color: 'text-neon-cyan',
      bgColor: 'bg-neon-cyan/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`glass rounded-xl p-4 ${stat.bgColor}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon size={18} className={stat.color} />
            <span className="text-xs text-gray-400 uppercase">{stat.label}</span>
          </div>
          <div className={`text-xl font-bold ${stat.color}`}>
            {stat.prefix || ''}{Math.abs(stat.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{stat.suffix || ''}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
