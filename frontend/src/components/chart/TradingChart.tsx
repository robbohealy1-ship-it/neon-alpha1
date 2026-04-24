import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, LineData, LineSeries, Time } from 'lightweight-charts'
import { RefreshCw } from 'lucide-react'

interface Setup {
  id: string
  symbol: string
  coin: string
  entryZone: { low: number; high: number }
  stopLoss: number
  targets: number[]
  bias: 'Bullish' | 'Bearish'
}

interface TradingChartProps {
  setup: Setup
}

export default function TradingChart({ setup }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const handleRescale = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
      console.log('[TradingChart] Rescaled')
    }
  }

  useEffect(() => {
    console.log('[TradingChart] Effect starting')
    
    if (!chartContainerRef.current) {
      console.warn('[TradingChart] No container ref')
      return
    }

    if (!setup?.entryZone || typeof setup.entryZone.low !== 'number' || typeof setup.entryZone.high !== 'number') {
      console.warn('[TradingChart] Invalid setup data', setup)
      return
    }

    const containerWidth = chartContainerRef.current.clientWidth
    const containerHeight = chartContainerRef.current.clientHeight
    console.log('[TradingChart] Dimensions:', { containerWidth, containerHeight })
    
    if (containerWidth === 0 || containerHeight === 0) {
      console.warn('[TradingChart] Container has zero dimensions')
      return
    }

    let chart: IChartApi | null = null
    
    try {
      console.log('[TradingChart] Creating chart...')
      chart = createChart(chartContainerRef.current, {
        width: containerWidth,
        height: containerHeight,
        layout: {
          background: { color: '#0a0a0f' },
          textColor: '#d1d5db',
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { 
          borderColor: '#374151',
          visible: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        leftPriceScale: { visible: false },
        timeScale: { 
          borderColor: '#374151',
          timeVisible: true,
        },
      })

    chartRef.current = chart

    // Calculate base price first
    const basePrice = (setup.entryZone.low + setup.entryZone.high) / 2

    // Create line series for price with last value visible
    const lineSeries = chart.addSeries(LineSeries, {
      color: setup.bias === 'Bullish' ? '#22c55e' : '#ef4444',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      lastValueVisible: true,
      priceLineVisible: false,
      priceFormat: {
        type: 'price',
        precision: basePrice < 1 ? 6 : basePrice < 100 ? 4 : 2,
        minMove: 0.000001,
      },
    })

    candlestickSeriesRef.current = lineSeries as any

    // Generate mock line chart data around the entry zone
    const data: LineData[] = []
    const now = new Date()
    
    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      const volatility = basePrice * 0.02
      const trend = setup.bias === 'Bullish' ? 1 : -1
      
      // Generate closing price with trend
      const value = basePrice + (Math.random() - 0.5) * volatility + (30 - i) * trend * basePrice * 0.001
      
      // Use Unix timestamp for proper ordering
      data.push({
        time: Math.floor(time.getTime() / 1000),
        value,
      } as LineData)
    }

    lineSeries.setData(data)
    
    if (!chart) {
      console.warn('[TradingChart] Chart is null')
      return
    }
    
    // Get time range for horizontal lines
    const firstTime = data[0]?.time || Math.floor(Date.now() / 1000) - 30 * 3600
    const lastTime = data[data.length - 1]?.time || Math.floor(Date.now() / 1000)
    
    // Add Entry Zone Low line (cyan dotted, thin)
    const entryLowSeries = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 1,
      lastValueVisible: true,
      title: 'Entry',
      priceLineVisible: false,
      lineStyle: 2, // dotted
    })
    entryLowSeries.setData([
      { time: firstTime as Time, value: setup.entryZone.low },
      { time: lastTime as Time, value: setup.entryZone.low },
    ])
    
    // Add Entry Zone High line (cyan dotted, thin)
    const entryHighSeries = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 1,
      lastValueVisible: true,
      title: 'Entry High',
      priceLineVisible: false,
      lineStyle: 2, // dotted
    })
    entryHighSeries.setData([
      { time: firstTime as Time, value: setup.entryZone.high },
      { time: lastTime as Time, value: setup.entryZone.high },
    ])
    
    // Add Stop Loss line (red, thin, dotted)
    const slSeries = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 1,
      lastValueVisible: true,
      title: 'SL',
      priceLineVisible: false,
      lineStyle: 2, // dotted
    })
    slSeries.setData([
      { time: firstTime as Time, value: setup.stopLoss },
      { time: lastTime as Time, value: setup.stopLoss },
    ])
    
    // Add Target lines (green, thin, dotted)
    setup.targets.forEach((target, index) => {
      if (!chart) return
      const tpSeries = chart.addSeries(LineSeries, {
        color: '#22c55e',
        lineWidth: 1,
        lastValueVisible: true,
        title: `TP${index + 1}`,
        priceLineVisible: false,
        lineStyle: 2, // dotted
      })
      tpSeries.setData([
        { time: firstTime as Time, value: target },
        { time: lastTime as Time, value: target },
      ])
    })
    
    chart.timeScale().fitContent()
    console.log('[TradingChart] Line chart with trade levels created successfully')

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chart) {
        chart.remove()
      }
    }
    } catch (err) {
      console.error('[TradingChart] Error:', err)
    }
  }, [setup])

  // Validate setup for rendering
  if (!setup?.entryZone || typeof setup.entryZone.low !== 'number') {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-dark-900 rounded-xl border border-gray-700/50">
        <p>Chart unavailable</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-dark-900 rounded-xl overflow-hidden border border-gray-700/50">
      <div className="p-3 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">{setup.coin}</span>
          <span className="text-xs text-gray-500">Binance</span>
          <span className={`text-xs px-2 py-0.5 rounded ${setup.bias === 'Bullish' ? 'bg-neon-green/20 text-neon-green' : 'bg-red-400/20 text-red-400'}`}>
            {setup.bias}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neon-cyan"></span>
            Entry Zone
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            SL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neon-green"></span>
            TP
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${setup.bias === 'Bullish' ? 'bg-neon-green' : 'bg-red-400'}`}></span>
            Price
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://www.tradingview.com/chart/?symbol=BINANCE:${setup.symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
            title="Open in TradingView"
          >
            <svg width="16" height="16" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0H0V28H12V0Z" fill="#2962FF"/>
              <path d="M17 28L24.5 0H30L22.5 28H17Z" fill="#2962FF"/>
              <path d="M32 28L36 14L32 0H26L30 14L26 28H32Z" fill="#2962FF"/>
            </svg>
          </a>
          <button
            onClick={handleRescale}
            className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
            title="Rescale / Fit content"
          >
            <RefreshCw size={14} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>
      <div ref={chartContainerRef} className="h-[calc(100%-48px)]" />
    </div>
  )
}
