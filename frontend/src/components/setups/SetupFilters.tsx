import { Filter, Search, Clock, Target, Zap } from 'lucide-react'

interface SetupFiltersProps {
  statusFilter: string
  biasFilter: string
  searchQuery: string
  onStatusChange: (status: string) => void
  onBiasChange: (bias: string) => void
  onSearchChange: (query: string) => void
  totalCount: number
  formingCount: number
  nearTriggerCount: number
  triggeredCount: number
}

export default function SetupFilters({
  statusFilter,
  biasFilter,
  searchQuery,
  onStatusChange,
  onBiasChange,
  onSearchChange,
  totalCount,
  formingCount,
  nearTriggerCount,
  triggeredCount
}: SetupFiltersProps) {
  return (
    <div className="p-4 border-b border-gray-700/50 bg-dark-800/30">
      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => onStatusChange('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'all' 
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Zap size={14} />
          All <span className="text-xs opacity-70">({totalCount})</span>
        </button>
        
        <button
          onClick={() => onStatusChange('NEAR TRIGGER')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'NEAR TRIGGER' 
              ? 'bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/50' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Target size={14} />
          Near Trigger <span className="text-xs opacity-70">({nearTriggerCount})</span>
        </button>
        
        <button
          onClick={() => onStatusChange('TRIGGERED')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'TRIGGERED' 
              ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Zap size={14} />
          Triggered <span className="text-xs opacity-70">({triggeredCount})</span>
        </button>
        
        <button
          onClick={() => onStatusChange('FORMING')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'FORMING' 
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Clock size={14} />
          Forming <span className="text-xs opacity-70">({formingCount})</span>
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3">
        {/* Bias Filter */}
        <select
          value={biasFilter}
          onChange={(e) => onBiasChange(e.target.value)}
          className="bg-dark-700 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
        >
          <option value="all">All Biases</option>
          <option value="Bullish">Bullish</option>
          <option value="Bearish">Bearish</option>
        </select>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search symbol (e.g., BTC, ETH)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-dark-700 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neon-cyan"
          />
        </div>

        {/* Filter Icon */}
        <button className="p-2 rounded-lg bg-dark-700 border border-gray-700 text-gray-400 hover:text-white">
          <Filter size={18} />
        </button>
      </div>
    </div>
  )
}
