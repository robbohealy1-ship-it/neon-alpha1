import { motion } from 'framer-motion'

interface FearGreedGaugeProps {
  value: number
  classification: string
  onClick?: () => void
}

export default function FearGreedGauge({ value, classification, onClick }: FearGreedGaugeProps) {
  // Calculate rotation angle (0 = Extreme Fear, 100 = Extreme Greed)
  // Gauge is 180 degrees total, starting from -90 (left) to 90 (right)
  const angle = -90 + (value / 100) * 180

  const getColor = (val: number) => {
    if (val <= 20) return '#ef4444' // Red - Extreme Fear
    if (val <= 40) return '#f97316' // Orange - Fear
    if (val <= 60) return '#eab308' // Yellow - Neutral
    if (val <= 80) return '#22c55e' // Green - Greed
    return '#10b981' // Emerald - Extreme Greed
  }

  const getLabel = (val: number) => {
    if (val <= 20) return 'Extreme Fear'
    if (val <= 40) return 'Fear'
    if (val <= 60) return 'Neutral'
    if (val <= 80) return 'Greed'
    return 'Extreme Greed'
  }

  const color = getColor(value)
  const label = classification || getLabel(value)

  return (
    <div 
      className={`flex flex-col items-center ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
      title={onClick ? 'Click for analytics & insights' : undefined}
    >
      {/* Gauge Container */}
      <div className="relative w-48 h-24 overflow-hidden">
        {/* Background Arc */}
        <svg
          viewBox="0 0 200 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMin slice"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Active Arc - shows up to current value */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * value) / 100}
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - (251.2 * value) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            filter="url(#glow)"
          />

          {/* Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ duration: 1.5, ease: "easeOut", type: "spring", stiffness: 60 }}
            style={{ transformOrigin: '100px 100px' }}
          >
            {/* Needle Line */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="25"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#glow)"
            />
            {/* Needle Center Dot */}
            <circle
              cx="100"
              cy="100"
              r="8"
              fill={color}
              filter="url(#glow)"
            />
          </motion.g>

          {/* Tick Marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = -90 + (tick / 100) * 180
            const radian = (tickAngle * Math.PI) / 180
            const x1 = 100 + 70 * Math.cos(radian)
            const y1 = 100 + 70 * Math.sin(radian)
            const x2 = 100 + 80 * Math.cos(radian)
            const y2 = 100 + 80 * Math.sin(radian)
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#4b5563"
                strokeWidth="2"
              />
            )
          })}
        </svg>

        {/* Value Display in Center - More Prominent */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-5xl font-bold"
            style={{ color }}
          >
            {value}
          </motion.div>
        </div>
      </div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-lg font-semibold"
        style={{ color }}
      >
        {label}
      </motion.div>

      {/* Scale Labels - Fixed Layout */}
      <div className="flex justify-between w-full max-w-[200px] mt-4 text-[10px] text-gray-400">
        <div className="text-left leading-tight">
          <div className="font-medium">Extreme</div>
          <div>Fear</div>
        </div>
        <div className="text-center leading-tight">
          <div className="font-medium">Neutral</div>
        </div>
        <div className="text-right leading-tight">
          <div className="font-medium">Extreme</div>
          <div>Greed</div>
        </div>
      </div>
    </div>
  )
}
