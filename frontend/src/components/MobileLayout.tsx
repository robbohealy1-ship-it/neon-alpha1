import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Target, Activity, Archive, History, Sparkles,
  Bell, Settings, Menu, X, ChevronLeft, User, LogOut, TrendingUp,
  Shield, HelpCircle, CreditCard
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect, useRef } from 'react'
import { usePWAInstall } from '../hooks/useMobileGestures'
import { usePlatform, useHaptics } from '../hooks/usePlatform'

// Mobile-optimized navigation items
const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/setups', icon: Target, label: 'Setups' },
  { to: '/signals', icon: Activity, label: 'Signals' },
  { to: '/setup-history', icon: Archive, label: 'History' },
  { to: '/signal-journal', icon: History, label: 'Journal' },
]

const moreMenuItems = [
  { to: '/alpha-picks', icon: Sparkles, label: 'Alpha Picks', badge: 'PRO' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/m/security', icon: Shield, label: 'Security' },
  { to: '/m/billing', icon: CreditCard, label: 'Billing' },
  { to: '/m/help', icon: HelpCircle, label: 'Help Center' },
]

export default function MobileLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { isInstallable, promptInstall } = usePWAInstall()
  const { platform, isNative, isPWA } = usePlatform()
  const { trigger: haptic } = useHaptics()
  
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)

  // Platform-specific effects
  useEffect(() => {
    if (isNative) {
      // Native app specific setup
      document.body.classList.add('native-app');
    }
    if (isPWA) {
      document.body.classList.add('pwa-mode');
    }
  }, [isNative, isPWA])

  // Show install prompt after delay
  useEffect(() => {
    if (isInstallable && !localStorage.getItem('installPromptDismissed')) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable])

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname
    const item = [...mobileNavItems, ...moreMenuItems].find(i => i.to === path)
    return item?.label || 'Neon Alpha'
  }

  const showBackButton = location.pathname !== '/dashboard'

  return (
    <div 
      className="h-[100dvh] flex flex-col bg-dark-950"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Fixed Header */}
      <header className="flex-none bg-dark-900/95 backdrop-blur-xl border-b border-trading-cyan/10 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          {showBackButton ? (
            <button 
              onClick={() => {
                haptic('light')
                navigate(-1)
              }}
              className="p-2 -ml-2 rounded-lg active:bg-dark-700/50 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-200" />
            </button>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => haptic('light')}>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-trading-cyan to-trading-blue flex items-center justify-center shadow-lg shadow-trading-cyan/20">
                <TrendingUp size={20} className="text-dark-950" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight">NEON ALPHA</span>
                <span className="text-[10px] text-trading-cyan font-medium tracking-wider flex items-center gap-1">
                  TERMINAL
                  {isNative && (
                    <span className="px-1 py-0.5 bg-trading-gold/20 text-trading-gold text-[8px] rounded">
                      {platform}
                    </span>
                  )}
                </span>
              </div>
            </Link>
          )}
          
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-lg active:bg-dark-700/50 transition-colors">
              <Bell size={20} className="text-gray-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-trading-gold rounded-full animate-pulse" />
            </button>
            
            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-trading-cyan/20 to-trading-blue/20 border border-trading-cyan/40 flex items-center justify-center active:scale-95 transition-transform"
              >
                <User size={18} className="text-trading-cyan" />
              </button>
              
              {/* Profile Dropdown */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-dark-850 border border-dark-600 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/50"
                    >
                      <div className="p-3 border-b border-dark-700 bg-gradient-to-r from-dark-800 to-dark-850">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.email || 'User'}
                        </p>
                        <p className="text-xs text-trading-gold font-medium mt-0.5">
                          {user?.tier || user?.subscriptionTier || 'Free'}
                        </p>
                      </div>
                      <Link 
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark-700/50 active:bg-dark-700 transition-colors"
                      >
                        <Settings size={18} className="text-trading-cyan" />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-trading-loss hover:bg-dark-700/50 active:bg-dark-700 transition-colors"
                      >
                        <LogOut size={18} />
                        <span className="text-sm">Logout</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Page Title */}
        {showBackButton && (
          <div className="px-4 pb-3 -mt-1">
            <h1 className="text-base font-semibold text-white tracking-wide">{getPageTitle()}</h1>
          </div>
        )}
      </header>

      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-none bg-gradient-to-r from-trading-cyan/10 to-trading-blue/10 border-b border-trading-cyan/20 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-trading-cyan to-trading-blue flex items-center justify-center flex-shrink-0 shadow-lg shadow-trading-cyan/20">
                  <TrendingUp size={20} className="text-dark-950" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Install Neon Alpha</p>
                  <p className="text-xs text-gray-400">Add to home screen</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={promptInstall}
                  className="px-4 py-2 bg-trading-cyan text-dark-950 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  Install
                </button>
                <button
                  onClick={handleInstallDismiss}
                  className="p-2 text-gray-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Scrollable */}
      <main 
        ref={contentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth bg-dark-950"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="min-h-full">
          <Outlet />
        </div>
        {/* Bottom padding for safe area + nav bar */}
        <div className="h-20" />
      </main>

      {/* Bottom Navigation Bar - Fixed */}
      <nav 
        className="flex-none bg-dark-900/95 backdrop-blur-xl border-t border-trading-cyan/10 z-50"
      >
        <div className="flex items-center justify-around px-1 h-16">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => haptic('light')}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all active:scale-95 min-w-[56px] ${
                    isActive
                      ? 'text-trading-cyan'
                      : 'text-gray-500'
                  }`
                }
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-trading-cyan rounded-full shadow-lg shadow-trading-cyan/50"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-trading-cyan' : ''}`}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
          
          {/* More Menu Button */}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl text-gray-500 active:scale-95 transition-all min-w-[56px]"
          >
            <Menu size={22} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <AnimatePresence>
        {moreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setMoreMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-dark-900 rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
              style={{ 
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)'
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-dark-600 rounded-full" />
              </div>
              
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Menu</h2>
                  <button 
                    onClick={() => setMoreMenuOpen(false)}
                    className="p-2 -mr-2 rounded-lg hover:bg-dark-700/50 active:bg-dark-700"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {moreMenuItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                          isActive
                            ? 'bg-trading-cyan/10 text-trading-cyan border border-trading-cyan/20'
                            : 'text-white hover:bg-dark-700/50'
                        }`
                      }
                    >
                      <item.icon size={22} />
                      <span className="font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-trading-gold to-trading-gold-glow text-dark-950 text-xs font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
                
                {/* App Info */}
                <div className="mt-6 pt-4 border-t border-dark-700 text-center">
                  <p className="text-xs text-gray-500 font-mono">NEON ALPHA TERMINAL v1.0</p>
                  <p className="text-xs text-gray-600 mt-1">Professional Trading Signals</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
