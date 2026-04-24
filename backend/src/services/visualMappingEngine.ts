/**
 * Visual Mapping Engine - Chart Object Generator
 * 
 * Takes market state and converts to chart-native objects:
 * - Candles
 * - Overlays (liquidity, FVGs, order blocks)
 * - Markers (BOS, CHoCH, sweeps)
 * - Signal lines (entry, SL, TP)
 */

import { SymbolState, Candle, LiquidityZone, FVGZone, OrderBlock, BOSEvent } from './marketStateEngine'
import { FilteredSignal } from './edgeFilterEngine'

export interface ChartCandle {
  time: number | string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface LiquidityOverlay {
  id: string
  type: 'equal_highs' | 'equal_lows' | 'swing_high' | 'swing_low'
  top: number
  bottom: number
  left: number | string
  right: number | string
  color: string
  label: string
  swept: boolean
  extendRight: boolean
}

export interface FVGOverlay {
  id: string
  type: 'bullish' | 'bearish'
  top: number
  bottom: number
  left: number | string
  right: number | string
  color: string
  label: string
  mitigated: boolean
}

export interface OrderBlockOverlay {
  id: string
  type: 'bullish' | 'bearish'
  open: number
  high: number
  low: number
  close: number
  time: number | string
  color: string
  mitigated: boolean
}

export interface StructureLine {
  id: string
  type: 'support' | 'resistance' | 'trend'
  price: number
  startTime: number | string
  endTime: number | string
  color: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  width: number
}

export interface ChartMarker {
  time: number | string
  position: 'aboveBar' | 'belowBar' | 'inBar'
  color: string
  shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square'
  text: string
  size: number
}

export interface SignalLine {
  id: string
  type: 'entry' | 'stopLoss' | 'takeProfit'
  price: number
  color: string
  lineWidth: number
  label: string
}

export interface ChartOverlays {
  candles: ChartCandle[]
  liquidityZones: LiquidityOverlay[]
  fvgZones: FVGOverlay[]
  orderBlocks: OrderBlockOverlay[]
  structureLines: StructureLine[]
  markers: ChartMarker[]
  signalLines?: SignalLine[]
}

export interface MarketStoryEvent {
  step: number
  timestamp: number | string
  event: string
  description: string
  type: 'sweep' | 'bos' | 'choch' | 'fvg' | 'entry'
  price: number
}

class VisualMappingEngine {
  /**
   * Convert symbol state to full chart overlays
   */
  mapStateToOverlays(
    state: SymbolState,
    signal?: FilteredSignal,
    options?: {
      showLiquidity?: boolean
      showFVGs?: boolean
      showOrderBlocks?: boolean
      showStructure?: boolean
      candleLimit?: number
    }
  ): ChartOverlays {
    const opts = {
      showLiquidity: true,
      showFVGs: true,
      showOrderBlocks: true,
      showStructure: true,
      candleLimit: 100,
      ...options
    }

    return {
      candles: this.mapCandles(state.candles, opts.candleLimit),
      liquidityZones: opts.showLiquidity ? this.mapLiquidityZones(state.liquidityZones) : [],
      fvgZones: opts.showFVGs ? this.mapFVGZones(state.fvgZones) : [],
      orderBlocks: opts.showOrderBlocks ? this.mapOrderBlocks(state.orderBlocks) : [],
      structureLines: opts.showStructure ? this.mapStructureLines(state) : [],
      markers: this.mapMarkers(state, signal),
      signalLines: signal ? this.mapSignalLines(signal) : undefined
    }
  }

  /**
   * Map raw candles to chart format
   */
  private mapCandles(candles: Candle[], limit: number): ChartCandle[] {
    return candles
      .slice(-limit)
      .map(c => ({
        time: c.timestamp / 1000, // TradingView uses seconds
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      }))
  }

  /**
   * Map liquidity zones to overlay format
   */
  private mapLiquidityZones(zones: LiquidityZone[]): LiquidityOverlay[] {
    return zones.map(zone => ({
      id: zone.id,
      type: zone.type,
      top: zone.upperBound,
      bottom: zone.lowerBound,
      left: zone.timestamp / 1000,
      right: 'end', // Extend to right edge
      color: zone.swept 
        ? zone.type.includes('high') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
        : zone.type.includes('high') ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
      label: zone.swept ? `${zone.type} (SWEPT)` : zone.type,
      swept: zone.swept,
      extendRight: true
    }))
  }

  /**
   * Map FVG zones to overlay format
   */
  private mapFVGZones(fvgs: FVGZone[]): FVGOverlay[] {
    return fvgs.map(fvg => ({
      id: fvg.id,
      type: fvg.type,
      top: fvg.top,
      bottom: fvg.bottom,
      left: fvg.timestamp / 1000,
      right: fvg.mitigated ? (fvg.mitigationTimestamp || Date.now()) / 1000 : 'end',
      color: fvg.type === 'bullish' 
        ? fvg.mitigated ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.3)'
        : fvg.mitigated ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.3)',
      label: fvg.type === 'bullish' ? 'Bull FVG' : 'Bear FVG',
      mitigated: fvg.mitigated
    }))
  }

  /**
   * Map order blocks to overlay format
   */
  private mapOrderBlocks(obs: OrderBlock[]): OrderBlockOverlay[] {
    return obs.map(ob => ({
      id: ob.id,
      type: ob.type,
      open: ob.open,
      high: ob.high,
      low: ob.low,
      close: ob.close,
      time: ob.timestamp / 1000,
      color: ob.type === 'bullish' 
        ? ob.mitigated ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.5)'
        : ob.mitigated ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.5)',
      mitigated: ob.mitigated
    }))
  }

  /**
   * Map structure lines (support/resistance/trend)
   */
  private mapStructureLines(state: SymbolState): StructureLine[] {
    const lines: StructureLine[] = []
    const { swings, marketStructure } = state

    // Draw support/resistance from recent swings
    const recentSwings = swings.slice(-6)
    
    recentSwings.forEach((swing, i) => {
      lines.push({
        id: `structure-${swing.type}-${i}`,
        type: swing.type === 'high' ? 'resistance' : 'support',
        price: swing.price,
        startTime: swing.timestamp / 1000,
        endTime: 'end',
        color: swing.type === 'high' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)',
        lineStyle: 'dashed',
        width: 1
      })
    })

    return lines
  }

  /**
   * Map BOS/CHoCH/market events to markers
   */
  private mapMarkers(state: SymbolState, signal?: FilteredSignal): ChartMarker[] {
    const markers: ChartMarker[] = []

    // BOS markers
    state.bosEvents.slice(-5).forEach(bos => {
      markers.push({
        time: bos.timestamp / 1000,
        position: bos.direction === 'bullish' ? 'belowBar' : 'aboveBar',
        color: bos.direction === 'bullish' ? '#22c55e' : '#ef4444',
        shape: bos.direction === 'bullish' ? 'arrowUp' : 'arrowDown',
        text: bos.type,
        size: 2
      })
    })

    // Swept liquidity markers
    state.sweptLiquidity.slice(-3).forEach(sweep => {
      if (sweep.sweepTimestamp) {
        markers.push({
          time: sweep.sweepTimestamp / 1000,
          position: sweep.type.includes('high') ? 'aboveBar' : 'belowBar',
          color: sweep.type.includes('high') ? '#f97316' : '#22c55e',
          shape: 'circle',
          text: 'Sweep',
          size: 2
        })
      }
    })

    // Signal marker
    if (signal) {
      markers.push({
        time: signal.timestamp / 1000,
        position: signal.direction === 'LONG' ? 'belowBar' : 'aboveBar',
        color: signal.direction === 'LONG' ? '#06b6d4' : '#ef4444',
        shape: signal.direction === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `${signal.strategy} (${signal.edgeScore.total})`,
        size: 3
      })
    }

    return markers
  }

  /**
   * Map signal to entry/SL/TP lines
   */
  private mapSignalLines(signal: FilteredSignal): SignalLine[] {
    const lines: SignalLine[] = []

    // Entry line
    lines.push({
      id: 'entry',
      type: 'entry',
      price: signal.entryPrice,
      color: signal.direction === 'LONG' ? '#06b6d4' : '#ef4444',
      lineWidth: 2,
      label: `ENTRY @ ${signal.entryPrice.toFixed(2)}`
    })

    // Stop loss line
    lines.push({
      id: 'stopLoss',
      type: 'stopLoss',
      price: signal.stopLoss,
      color: '#ef4444',
      lineWidth: 2,
      label: `SL @ ${signal.stopLoss.toFixed(2)}`
    })

    // Take profit lines
    signal.takeProfits.forEach((tp, i) => {
      lines.push({
        id: `takeProfit${i}`,
        type: 'takeProfit',
        price: tp,
        color: '#22c55e',
        lineWidth: 1,
        label: `TP${i + 1} @ ${tp.toFixed(2)}`
      })
    })

    return lines
  }

  /**
   * Generate market story timeline for narrative display
   */
  generateMarketStory(state: SymbolState, signal?: FilteredSignal): MarketStoryEvent[] {
    const events: MarketStoryEvent[] = []
    
    // Sort all events by timestamp
    const allEvents: Array<{
      timestamp: number
      type: MarketStoryEvent['type']
      event: string
      description: string
      price: number
    }> = []

    // Add swept liquidity events
    state.sweptLiquidity.forEach(s => {
      if (s.sweepTimestamp) {
        allEvents.push({
          timestamp: s.sweepTimestamp,
          type: 'sweep',
          event: 'Liquidity Sweep',
          description: `${s.type.replace('_', ' ')} at ${s.priceLevel.toFixed(2)}`,
          price: s.sweepPrice || s.priceLevel
        })
      }
    })

    // Add BOS events
    state.bosEvents.forEach(bos => {
      allEvents.push({
        timestamp: bos.timestamp,
        type: bos.type === 'BOS' ? 'bos' : 'choch',
        event: bos.type,
        description: `${bos.direction} ${bos.type} confirmed at ${bos.price.toFixed(2)}`,
        price: bos.price
      })
    })

    // Add FVG formations
    state.fvgZones.forEach(fvg => {
      allEvents.push({
        timestamp: fvg.timestamp,
        type: 'fvg',
        event: 'FVG Formed',
        description: `${fvg.type} FVG between ${fvg.bottom.toFixed(2)} - ${fvg.top.toFixed(2)}`,
        price: (fvg.top + fvg.bottom) / 2
      })
    })

    // Add signal entry
    if (signal) {
      allEvents.push({
        timestamp: signal.timestamp,
        type: 'entry',
        event: 'Signal Entry',
        description: `${signal.strategy} ${signal.direction} at ${signal.entryPrice.toFixed(2)}`,
        price: signal.entryPrice
      })
    }

    // Sort and assign steps
    return allEvents
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10) // Keep last 10 events
      .map((e, i) => ({
        step: i + 1,
        timestamp: e.timestamp / 1000,
        event: e.event,
        description: e.description,
        type: e.type,
        price: e.price
      }))
  }

  /**
   * Generate lightweight chart data (for quick renders)
   */
  generateLightweightData(
    state: SymbolState,
    signal?: FilteredSignal
  ): {
    candles: ChartCandle[]
    markers: ChartMarker[]
    lines: SignalLine[]
  } {
    return {
      candles: this.mapCandles(state.candles, 50),
      markers: this.mapMarkers(state, signal),
      lines: signal ? this.mapSignalLines(signal) : []
    }
  }
}

// Singleton instance
export const visualMappingEngine = new VisualMappingEngine()
export default visualMappingEngine
