import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FREE_DAILY_LIMIT = 1;

export interface SignalLimitCheck {
  allowed: boolean;
  signalsViewed: number;
  remainingFree: number;
  limitReached: boolean;
  isPaidUser: boolean;
}

class SignalLimitService {
  // Check if user can view signals (returns current status without incrementing)
  async checkSignalLimit(userId: string, isPaidUser: boolean): Promise<SignalLimitCheck> {
    // Paid users have unlimited access
    if (isPaidUser) {
      return {
        allowed: true,
        signalsViewed: 0,
        remainingFree: -1, // Unlimited
        limitReached: false,
        isPaidUser: true,
      };
    }

    // Free users: check daily limit
    const today = this.getTodayDate();
    
    const viewRecord = await prisma.signalView.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    const signalsViewed = viewRecord?.signalsViewed || 0;
    const remainingFree = Math.max(0, FREE_DAILY_LIMIT - signalsViewed);
    const limitReached = signalsViewed >= FREE_DAILY_LIMIT;

    return {
      allowed: !limitReached,
      signalsViewed,
      remainingFree,
      limitReached,
      isPaidUser: false,
    };
  }

  // Increment signal view count when user views a signal
  async incrementSignalView(userId: string): Promise<SignalLimitCheck> {
    const today = this.getTodayDate();

    // Upsert: create if not exists, increment if exists
    const viewRecord = await prisma.signalView.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        signalsViewed: {
          increment: 1,
        },
      },
      create: {
        userId,
        date: today,
        signalsViewed: 1,
      },
    });

    const signalsViewed = viewRecord.signalsViewed;
    const remainingFree = Math.max(0, FREE_DAILY_LIMIT - signalsViewed);
    const limitReached = signalsViewed >= FREE_DAILY_LIMIT;

    return {
      allowed: !limitReached,
      signalsViewed,
      remainingFree,
      limitReached,
      isPaidUser: false,
    };
  }

  // Get today's signal limit status for a user
  async getTodayStatus(userId: string, isPaidUser: boolean): Promise<SignalLimitCheck> {
    if (isPaidUser) {
      return {
        allowed: true,
        signalsViewed: 0,
        remainingFree: -1,
        limitReached: false,
        isPaidUser: true,
      };
    }

    const today = this.getTodayDate();
    
    const viewRecord = await prisma.signalView.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    const signalsViewed = viewRecord?.signalsViewed || 0;
    const remainingFree = Math.max(0, FREE_DAILY_LIMIT - signalsViewed);
    const limitReached = signalsViewed >= FREE_DAILY_LIMIT;

    return {
      allowed: !limitReached,
      signalsViewed,
      remainingFree,
      limitReached,
      isPaidUser: false,
    };
  }

  // Reset all signal views (for testing or admin purposes)
  async resetAllViews(): Promise<void> {
    await prisma.signalView.deleteMany({});
  }

  // Get today's date in YYYY-MM-DD format
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}

export const signalLimitService = new SignalLimitService();
