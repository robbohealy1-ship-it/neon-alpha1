import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Target, Activity, Archive, History, Sparkles,
  Bell, Settings, Menu, X, ChevronLeft, User, LogOut
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect, useRef } from 'react'
import { usePWAInstall } from '../hooks/useMobileGestures'

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
]

export default function MobileLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  // Viewport detection removed - not needed for this component
  const { isInstallable, promptInstall } = usePWAInstall()
  
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle scroll behavior for header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = contentRef.current?.scrollTop || 0
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setHeaderVisible(false)
      } else {
        setHeaderVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    const content = contentRef.current
    if (content) {
      content.addEventListener('scroll', handleScroll, { passive: true })
      return () => content.removeEventListener('scroll', handleScroll)
    }
  }, [])

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
    <div className="fixed inset-0 bg-dark-900 flex flex-col overflow-hidden safe-area-inset">
      {/* Status Bar Spacer for iOS */}
      <div className="h-safe-top bg-dark-900" />
      
      {/* Collapsible Header */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: headerVisible ? 0 : -80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-dark-900/95 backdrop-blur-lg border-b border-gray-800/50 z-40"
      >
        <div className="flex items-center justify-between px-4 h-14">
          {showBackButton ? (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full active:bg-gray-800/50 transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg">Neon Alpha</span>
            </Link>
          )}
          
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 rounded-full active:bg-gray-800/50 transition-colors">
              <Bell size={22} className="text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
            </button>
            
            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <User size={18} className="text-neon-cyan" />
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
                      className="absolute right-0 top-full mt-2 w-48 glass border border-gray-700 rounded-xl overflow-hidden z-50 shadow-2xl"
                    >
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.email || 'User'}
                        </p>
                        <p className="text-xs text-gray-400">{user?.tier || user?.subscriptionTier || 'Free'}</p>
                      </div>
                      <Link 
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800/50 active:bg-gray-800"
                      >
                        <Settings size={18} />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800/50 active:bg-gray-800"
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
        
        {/* Page Title (when not on dashboard) */}
        {showBackButton && (
          <div className="px-4 pb-2">
            <h1 className="text-lg font-bold text-white">{getPageTitle()}</h1>
          </div>
        )}
      </motion.header>

      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border-b border-neon-cyan/30 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Install Neon Alpha</p>
                  <p className="text-xs text-gray-400">Add to home screen for app-like experience</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={promptInstall}
                  className="px-3 py-1.5 bg-neon-cyan text-dark-900 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  Install
                </button>
                <button
                  onClick={handleInstallDismiss}
                  className="p-1.5 text-gray-400 hover:text-white"
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
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{ 
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav 
        className="bg-dark-900/95 backdrop-blur-lg border-t border-gray-800/50 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 h-16">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 min-w-[60px] ${
                    isActive
                      ? 'text-neon-cyan'
                      : 'text-gray-400'
                  }`
                }
              >
                <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full"
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
          
          {/* More Menu Button */}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-gray-400 active:scale-95 transition-all min-w-[60px]"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setMoreMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-dark-900 rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-700 rounded-full" />
              </div>
              
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">More</h2>
                  <button 
                    onClick={() => setMoreMenuOpen(false)}
                    className="p-2 -mr-2 rounded-full hover:bg-gray-800"
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
                            ? 'bg-neon-cyan/10 text-neon-cyan'
                            : 'text-white hover:bg-gray-800/50'
                        }`
                      }
                    >
                      <item.icon size={24} />
                      <span className="font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-neon-purple to-pink-500 text-white text-xs font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
                
                {/* App Info */}
                <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-500">Neon Alpha Terminal v1.0</p>
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
