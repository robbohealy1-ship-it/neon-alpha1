import { useEffect, useRef } from 'react'

interface TradingViewChartProps {
  symbol: string
  theme?: 'dark' | 'light'
  strategy?: string[]
  timeframe?: string
}

// Enable trade-specific indicators and tools
const getStrategyIndicators = (_strategy?: string[]): string[] => {
  const indicators: string[] = []
  
  // Add RSI for momentum
  indicators.push('RSI@tv-basicstudies')
  
  // Add Bollinger Bands for volatility and price channels
  indicators.push('BB@tv-basicstudies')
  
  return indicators
}

// Map timeframe to TradingView interval
const getTimeframeInterval = (timeframe?: string): string => {
  if (!timeframe) return '60' // Default 1H
  
  const tf = timeframe.toLowerCase()
  if (tf.includes('1h') || tf.includes('1h')) return '60'
  if (tf.includes('4h') || tf.includes('4h')) return '240'
  if (tf.includes('1d') || tf.includes('daily')) return 'D'
  if (tf.includes('15m')) return '15'
  if (tf.includes('30m')) return '30'
  
  return '60' // Default 1H
}

export default function TradingViewChart({ 
  symbol, 
  theme = 'dark',
  strategy,
  timeframe
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Map common crypto symbols to TradingView format
    const tvSymbol = `BINANCE:${symbol}USDT`
    
    // Get trade-specific indicators
    const indicators = getStrategyIndicators(strategy)
    const interval = getTimeframeInterval(timeframe)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      timezone: 'exchange',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      withdateranges: true,
      range: '1D',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hotlist: false,
      hide_volume: true,
      hide_side_toolbar: false,
      details: true,
      studies: indicators,
      support_host: 'https://www.tradingview.com',
      enabled_features: [
        'show_logarithmic_scale', 
        'study_templates',
        'side_toolbar_in_fullscreen_mode',
        'header_in_fullscreen_mode'
      ],
      disabled_features: [
        'use_localstorage_for_settings',
        'volume_force_overlay'
      ],
      drawings_access: {
        type: 'white',
        tools: [
          { name: 'Trend Line', grayed: false },
          { name: 'Ray', grayed: false },
          { name: 'Extended Line', grayed: false },
          { name: 'Horizontal Line', grayed: false },
          { name: 'Horizontal Ray', grayed: false },
          { name: 'Parallel Channel', grayed: false },
          { name: 'Fib Retracement', grayed: false },
          { name: 'Fib Extension', grayed: false },
          { name: 'Long Position', grayed: false },
          { name: 'Short Position', grayed: false },
          { name: 'Risk/Reward Long', grayed: false },
          { name: 'Risk/Reward Short', grayed: false },
          { name: 'Date Range', grayed: false },
          { name: 'Price Range', grayed: false },
          { name: 'Rectangle', grayed: false },
          { name: 'Circle', grayed: false },
          { name: 'Text', grayed: false },
          { name: 'Callout', grayed: false },
          { name: 'Arrow', grayed: false },
          { name: 'Measure', grayed: false }
        ]
      }
    })

    containerRef.current.innerHTML = ''
    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.height = '100%'
    widgetContainer.style.width = '100%'
    
    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    widget.style.height = 'calc(100% - 32px)'
    widget.style.width = '100%'
    
    widgetContainer.appendChild(widget)
    widgetContainer.appendChild(script)
    containerRef.current.appendChild(widgetContainer)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, theme, strategy, timeframe])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ background: theme === 'dark' ? '#131722' : '#ffffff' }}
    />
  )
}
