import { Outlet, NavLink, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Target, BookOpen, Star, BarChart3, LogOut, Bell, Settings, HelpCircle, Shield, CreditCard, Zap, Activity, Sparkles, Archive, History } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'

export default function Layout() {
  const { t } = useTranslation()
  const { user, logout, token } = useAuthStore()
  const [alerts, setAlerts] = useState<any[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only load alerts if user is authenticated
    if (token) {
      loadAlerts()
      const interval = setInterval(loadAlerts, 10000)
      return () => clearInterval(interval)
    }
  }, [token])

  // Apply saved theme on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      const html = document.documentElement
      if (settings.theme === 'light') {
        html.classList.add('light')
        html.classList.remove('dark')
      } else {
        html.classList.add('dark')
        html.classList.remove('light')
      }
    }
  }, [])

  const loadAlerts = async () => {
    try {
      const { data } = await api.get('/alerts')
      setAlerts(data.slice(0, 5))
    } catch (error) {
      console.error('Failed to load alerts')
    }
  }

  const authenticatedNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/setups', icon: Target, label: 'Trade Setups' },
    { to: '/signals', icon: Activity, label: 'Signals' },
    { to: '/setup-history', icon: Archive, label: 'Setup History' },
    { to: '/signal-journal', icon: History, label: 'Signal Journal' },
    { to: '/alpha-picks', icon: Sparkles, label: 'Alpha Picks', badge: 'PRO' },
    { to: '/journal', icon: BookOpen, label: t('journal') },
    { to: '/watchlist', icon: Star, label: t('watchlist') },
    { to: '/analytics', icon: BarChart3, label: t('analytics') },
  ]

  const publicNavItems = [
    { to: '/setups', icon: Target, label: 'Trade Setups', public: true },
    { to: '/signals', icon: Activity, label: 'Signals', public: true },
    { to: '/alpha-picks', icon: Sparkles, label: 'Alpha Picks', badge: 'PRO', public: true },
  ]

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden md:flex w-64 glass border-r border-gray-800 flex-col flex-shrink-0"
      >
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group" title="Back to Home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center neon-glow group-hover:scale-105 transition-transform">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">NEON ALPHA</h1>
              <p className="text-xs text-gray-500">{t('tradingTerminal')}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {/* Authenticated navigation items */}
          {token && authenticatedNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 neon-glow'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-neon-purple to-pink-500 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Public navigation items (for non-logged-in users) */}
          {!token && publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 neon-glow'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-neon-purple to-pink-500 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {token ? (
            <>
              <div className="glass rounded-lg p-4 mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center text-sm font-bold">
                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user?.name || 'Trader'}</p>
                    <p className="text-xs text-gray-500 uppercase">{user?.tier || t('freeTier')}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 mb-3">
                <NavLink
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
                >
                  <Settings size={20} />
                  <span className="font-medium">{t('settings')}</span>
                </NavLink>
                <NavLink
                  to="/help"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
                >
                  <HelpCircle size={20} />
                  <span className="font-medium">{t('helpCenter')}</span>
                </NavLink>
                <NavLink
                  to="/security"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
                >
                  <Shield size={20} />
                  <span className="font-medium">{t('security')}</span>
                </NavLink>
                <NavLink
                  to="/billing"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
                >
                  <CreditCard size={20} />
                  <span className="font-medium">{t('billing')}</span>
                </NavLink>
              </div>
              
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium">{t('logout')}</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold hover:scale-105 transition-transform"
            >
              <span className="font-medium">Sign In</span>
            </Link>
          )}
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 glass border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
              <span className="text-sm text-gray-400">{t('liveMarketData')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <Bell size={20} className="text-gray-400" />
                {alerts.filter(a => !a.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-neon-cyan rounded-full"></span>
                )}
              </button>

              {showAlerts && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-80 glass rounded-lg p-4 z-50"
                >
                  <h3 className="font-semibold mb-3">{t('recentAlerts')}</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-sm text-gray-500">{t('noAlerts')}</p>
                    ) : (
                      alerts.map((alert) => (
                        <div key={alert.id} className="p-3 bg-dark-700 rounded-lg text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-neon-cyan">{alert.asset}</span>
                            <span className="text-xs text-gray-500">{alert.type}</span>
                          </div>
                          <p className="text-gray-400">{alert.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      {user && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-gray-800 z-50">
          <div className="flex items-center justify-around px-2 py-2">
            {authenticatedNavItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-neon-cyan'
                      : 'text-gray-400'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium truncate max-w-[60px]">{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400"
            >
              <Menu size={20} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </nav>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)} />
          <motion.div
            ref={mobileMenuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 bottom-0 w-72 glass border-l border-gray-800 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-gradient">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {authenticatedNavItems.slice(5).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                        : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
              <div className="border-t border-gray-800 my-4" />
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
              >
                <Settings size={20} />
                <span className="font-medium">{t('settings')}</span>
              </NavLink>
              <NavLink
                to="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
              >
                <HelpCircle size={20} />
                <span className="font-medium">{t('helpCenter')}</span>
              </NavLink>
              <NavLink
                to="/security"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-all"
              >
                <Shield size={20} />
                <span className="font-medium">{t('security')}</span>
              </NavLink>
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium">{t('logout')}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* Mobile Public Nav (when not logged in) */}
      {!token && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-gray-800 z-50">
          <div className="flex items-center justify-around px-2 py-2">
            {publicNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-neon-cyan'
                      : 'text-gray-400'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            ))}
            <Link
              to="/login"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-neon-cyan"
            >
              <LogOut size={20} />
              <span className="text-[10px] font-medium">Login</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}
