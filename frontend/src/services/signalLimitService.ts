import api from '../lib/api';

export interface SignalLimitStatus {
  allowed: boolean;
  signalsViewed: number;
  remainingFree: number;
  limitReached: boolean;
  isPaidUser: boolean;
  freeLimit: number;
}

class SignalLimitService {
  // Get today's signal limit status
  async getStatus(): Promise<SignalLimitStatus | null> {
    try {
      const { data } = await api.get('/signal-limit/status');
      return data;
    } catch (error) {
      console.error('Failed to get signal limit status:', error);
      return null;
    }
  }

  // Check if can view and increment count
  async checkAndIncrement(): Promise<SignalLimitStatus | null> {
    try {
      const { data } = await api.post('/signal-limit/view');
      return data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        // Limit reached
        return error.response.data;
      }
      console.error('Failed to check signal limit:', error);
      return null;
    }
  }

  // Reset all views (admin only, for testing)
  async resetViews(): Promise<void> {
    try {
      await api.post('/signal-limit/reset');
    } catch (error) {
      console.error('Failed to reset views:', error);
    }
  }
}

export const signalLimitService = new SignalLimitService();
