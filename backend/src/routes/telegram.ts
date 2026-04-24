import { Router } from 'express'
import { sendTelegramAlert, sendTestMessage, getBotInfo } from '../services/telegramService'
import { alertHistory } from '../models/AlertHistory'
import { randomUUID } from 'crypto'

const router = Router()

interface SignalRequest {
  coin: string
  direction: 'LONG' | 'SHORT'
  entry: number
  stopLoss: number
  takeProfit: number
  confidence: number
  strategy?: string
  timeframe?: string
}

/**
 * POST /api/telegram/signal
 * Send a new trading signal alert to Telegram
 */
router.post('/signal', async (req, res) => {
  try {
    const signal: SignalRequest = req.body

    // Validate required fields
    if (!signal.coin || !signal.direction || !signal.entry || !signal.stopLoss || !signal.takeProfit) {
      return res.status(400).json({
        error: 'Missing required fields: coin, direction, entry, stopLoss, takeProfit'
      })
    }

    // Check rate limiting (1 alert per coin per 10 minutes)
    if (!alertHistory.canSendAlert(signal.coin)) {
      const minutesRemaining = alertHistory.getTimeUntilNextAlert(signal.coin)
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Please wait ${minutesRemaining} minutes before sending another alert for ${signal.coin}`,
        retryAfter: minutesRemaining * 60
      })
    }

    // Send Telegram alert
    const success = await sendTelegramAlert(signal)

    // Record in history
    const alertRecord = {
      id: randomUUID(),
      signalId: randomUUID(),
      coin: signal.coin,
      direction: signal.direction,
      sentAt: new Date(),
      status: (success ? 'sent' : 'failed') as 'sent' | 'failed',
      error: success ? undefined : 'Failed to send Telegram message'
    }
    alertHistory.addAlert(alertRecord)

    if (success) {
      res.json({
        success: true,
        message: `Alert sent for ${signal.coin} ${signal.direction}`,
        alertId: alertRecord.id
      })
    } else {
      res.status(500).json({
        error: 'Failed to send Telegram alert',
        message: 'Check bot token and chat ID configuration'
      })
    }
  } catch (error) {
    console.error('Error in /signal endpoint:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * POST /api/telegram/test
 * Send a test message to verify Telegram integration
 */
router.post('/test', async (req, res) => {
  try {
    const success = await sendTestMessage()
    
    if (success) {
      res.json({ success: true, message: 'Test message sent successfully' })
    } else {
      res.status(500).json({
        error: 'Failed to send test message',
        message: 'Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env'
      })
    }
  } catch (error) {
    console.error('Error in /test endpoint:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * GET /api/telegram/status
 * Check Telegram bot status and configuration
 */
router.get('/status', async (req, res) => {
  try {
    const botInfo = await getBotInfo()
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN
    const hasChatId = !!process.env.TELEGRAM_CHAT_ID

    res.json({
      configured: hasToken && hasChatId,
      hasToken,
      hasChatId,
      botName: botInfo?.username,
      botId: botInfo?.id,
      canSendMessages: hasToken && hasChatId
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check status' })
  }
})

/**
 * GET /api/telegram/history
 * Get recent alert history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const alerts = alertHistory.getRecentAlerts(limit)
    
    res.json({
      count: alerts.length,
      alerts: alerts.map(a => ({
        ...a,
        sentAt: a.sentAt.toISOString()
      }))
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

/**
 * GET /api/telegram/rate-limit/:coin
 * Check rate limit status for a specific coin
 */
router.get('/rate-limit/:coin', async (req, res) => {
  try {
    const { coin } = req.params
    const canSend = alertHistory.canSendAlert(coin)
    const minutesRemaining = alertHistory.getTimeUntilNextAlert(coin)

    res.json({
      coin,
      canSend,
      minutesRemaining,
      nextAvailable: canSend ? 'now' : `in ${minutesRemaining} minutes`
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check rate limit' })
  }
})

export default router
