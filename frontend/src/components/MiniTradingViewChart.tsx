import { useEffect, useRef } from 'react'

interface MiniTradingViewChartProps {
  symbol: string
  theme?: 'dark' | 'light'
  strategy?: string[]
  timeframe?: string
}

// Map strategy to appropriate indicators
const getStrategyIndicators = (strategy?: string[]): string[] => {
  if (!strategy || strategy.length === 0) {
    return ['RSI']
  }
  
  const strategyName = strategy[0].toLowerCase()
  
  if (strategyName.includes('fair value') || strategyName.includes('fvg')) {
    return ['VWAP@tv-basicstudies']
  }
  
  if (strategyName.includes('trend') || strategyName.includes('continuation')) {
    return ['EMA@tv-basicstudies']
  }
  
  if (strategyName.includes('sweep') || strategyName.includes('liquidity')) {
    return ['BB@tv-basicstudies']
  }
  
  if (strategyName.includes('structure') || strategyName.includes('bos')) {
    return ['MACD']
  }
  
  if (strategyName.includes('range') || strategyName.includes('breakout')) {
    return ['BB@tv-basicstudies']
  }
  
  return ['RSI']
}

// Map timeframe to TradingView interval
const getTimeframeInterval = (timeframe?: string): string => {
  if (!timeframe) return '60'
  
  const tf = timeframe.toLowerCase()
  if (tf.includes('1h')) return '60'
  if (tf.includes('4h')) return '240'
  if (tf.includes('1d')) return 'D'
  if (tf.includes('15m')) return '15'
  if (tf.includes('30m')) return '30'
  
  return '60'
}

export default function MiniTradingViewChart({ 
  symbol, 
  theme = 'dark',
  strategy,
  timeframe
}: MiniTradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const tvSymbol = `BINANCE:${symbol}USDT`
    // These variables are reserved for future indicator/interval customization
    void getStrategyIndicators(strategy)
    void getTimeframeInterval(timeframe)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '1D',
      colorTheme: theme,
      trendLineColor: theme === 'dark' ? '#00f0ff' : '#2962FF',
      underLineColor: theme === 'dark' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(41, 98, 255, 0.1)',
      underLineBottomColor: theme === 'dark' ? 'rgba(0, 240, 255, 0)' : 'rgba(41, 98, 255, 0)',
      isTransparent: true,
      autosize: true,
      largeChartUrl: `https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}USDT`,
      chartOnly: true,
      noTimeScale: true
    })

    containerRef.current.innerHTML = ''
    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.height = '100%'
    widgetContainer.style.width = '100%'
    
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
      style={{ background: 'transparent' }}
    />
  )
}
