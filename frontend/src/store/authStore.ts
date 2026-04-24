import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscriptionService } from '../services/subscriptionService'

interface User {
  id: string
  email: string
  name?: string
  tier?: string
  subscriptionTier?: string
}

interface AuthState {
  token: string | null
  user: User | null
  rememberMe: boolean
  setAuth: (token: string, user: User, rememberMe?: boolean) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
  checkAutoLogin: () => boolean
}

// Custom storage that switches between localStorage and sessionStorage
const customStorage = {
  getItem: (name: string) => {
    // Try localStorage first (remember me), then sessionStorage
    const local = localStorage.getItem(name)
    if (local) return local
    return sessionStorage.getItem(name)
  },
  setItem: (name: string, value: string, rememberMe?: boolean) => {
    if (rememberMe) {
      localStorage.setItem(name, value)
      sessionStorage.removeItem(name)
    } else {
      sessionStorage.setItem(name, value)
      localStorage.removeItem(name)
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      rememberMe: false,
      setAuth: (token, user, rememberMe = false) => {
        const normalizedUser = {
          ...user,
          tier: user.tier || user.subscriptionTier,
          subscriptionTier: user.subscriptionTier || user.tier,
        }

        set({ token, user: normalizedUser, rememberMe })
        // Store in appropriate storage
        const state = JSON.stringify({ token, user: normalizedUser, rememberMe })
        if (rememberMe) {
          localStorage.setItem('auth-storage', state)
        } else {
          sessionStorage.setItem('auth-storage', state)
        }
      },
      updateUser: (updates) => {
        const { token, user, rememberMe } = get()
        if (!user) return

        const updatedUser = {
          ...user,
          ...updates,
          tier: updates.tier || updates.subscriptionTier || user.tier || user.subscriptionTier,
          subscriptionTier: updates.subscriptionTier || updates.tier || user.subscriptionTier || user.tier,
        }
        set({ user: updatedUser })

        const state = JSON.stringify({ token, user: updatedUser, rememberMe })
        if (rememberMe) {
          localStorage.setItem('auth-storage', state)
        } else {
          sessionStorage.setItem('auth-storage', state)
        }
      },
      logout: () => {
        subscriptionService.clearCache()
        set({ token: null, user: null, rememberMe: false })
        localStorage.removeItem('auth-storage')
        sessionStorage.removeItem('auth-storage')
      },
      checkAutoLogin: () => {
        const local = localStorage.getItem('auth-storage')
        const session = sessionStorage.getItem('auth-storage')
        const stored = local || session
        
        if (stored) {
          try {
            const { token, user } = JSON.parse(stored)
            if (token && user) {
              set({ token, user, rememberMe: !!local })
              return true
            }
          } catch (e) {
            return false
          }
        }
        return false
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => customStorage as any),
    }
  )
)
