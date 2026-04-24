import api from '../lib/api'

interface SignalData {
  coin: string
  direction: 'LONG' | 'SHORT'
  entry: number
  stopLoss: number
  takeProfit: number
  confidence: number
  strategy?: string
  timeframe?: string
}

interface AlertRecord {
  id: string
  signalId: string
  coin: string
  direction: 'LONG' | 'SHORT'
  sentAt: string
  status: 'sent' | 'failed'
  error?: string
}

/**
 * Send a trading signal alert to Telegram
 */
export async function sendTelegramSignal(signal: SignalData): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await api.post('/telegram/signal', signal)
    return {
      success: true,
      message: data.message
    }
  } catch (error: any) {
    if (error.response?.status === 429) {
      return {
        success: false,
        message: error.response.data.message || 'Rate limit exceeded'
      }
    }
    return {
      success: false,
      message: error.response?.data?.error || 'Failed to send alert'
    }
  }
}

/**
 * Send test message to verify Telegram integration
 */
export async function sendTestMessage(): Promise<boolean> {
  try {
    const { data } = await api.post('/telegram/test')
    return data.success
  } catch (error) {
    return false
  }
}

/**
 * Check Telegram bot status
 */
export async function getTelegramStatus(): Promise<{
  configured: boolean
  hasToken: boolean
  hasChatId: boolean
  botName?: string
  canSendMessages: boolean
}> {
  try {
    const { data } = await api.get('/telegram/status')
    return data
  } catch (error) {
    return {
      configured: false,
      hasToken: false,
      hasChatId: false,
      canSendMessages: false
    }
  }
}

/**
 * Get recent alert history
 */
export async function getAlertHistory(limit: number = 50): Promise<{
  count: number
  alerts: AlertRecord[]
}> {
  try {
    const { data } = await api.get(`/telegram/history?limit=${limit}`)
    return data
  } catch (error) {
    return {
      count: 0,
      alerts: []
    }
  }
}

/**
 * Check rate limit status for a coin
 */
export async function checkRateLimit(coin: string): Promise<{
  coin: string
  canSend: boolean
  minutesRemaining: number
  nextAvailable: string
}> {
  try {
    const { data } = await api.get(`/telegram/rate-limit/${coin}`)
    return data
  } catch (error) {
    return {
      coin,
      canSend: true,
      minutesRemaining: 0,
      nextAvailable: 'now'
    }
  }
}
