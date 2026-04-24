/**
 * Simple in-memory store for alert history
 * In production, use Redis or PostgreSQL
 */

export interface AlertRecord {
  id: string
  signalId: string
  coin: string
  direction: 'LONG' | 'SHORT'
  sentAt: Date
  telegramMessageId?: number
  status: 'sent' | 'failed'
  error?: string
}

class AlertHistoryStore {
  private alerts: AlertRecord[] = []
  private lastAlertTime: Map<string, Date> = new Map()

  /**
   * Add a new alert record
   */
  addAlert(alert: AlertRecord): void {
    this.alerts.unshift(alert) // Add to beginning
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100)
    }

    // Update last alert time for coin
    this.lastAlertTime.set(alert.coin, alert.sentAt)
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): AlertRecord[] {
    return this.alerts.slice(0, limit)
  }

  /**
   * Check if we can send alert for coin (rate limiting)
   * Returns true if enough time has passed (10 minutes)
   */
  canSendAlert(coin: string): boolean {
    const lastTime = this.lastAlertTime.get(coin)
    if (!lastTime) return true

    const now = new Date()
    const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60)
    
    return diffMinutes >= 10
  }

  /**
   * Get time until next alert can be sent
   */
  getTimeUntilNextAlert(coin: string): number {
    const lastTime = this.lastAlertTime.get(coin)
    if (!lastTime) return 0

    const now = new Date()
    const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60)
    const remaining = Math.max(0, 10 - diffMinutes)
    
    return Math.ceil(remaining)
  }

  /**
   * Clear old alerts (keep last 24 hours)
   */
  cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(a => a.sentAt > cutoff)
  }
}

export const alertHistory = new AlertHistoryStore()
