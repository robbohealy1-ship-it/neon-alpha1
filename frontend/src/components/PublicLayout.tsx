import { Outlet, NavLink, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, LogIn, Zap, Activity } from 'lucide-react'

export default function PublicLayout() {
  const navItems = [
    { to: '/signals', icon: Activity, label: 'Signals' },
    { to: '/setups', icon: Target, label: 'Trade Setups' },
  ]

  return (
    <div className="flex h-screen bg-dark-900">
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 glass border-r border-gray-800 flex flex-col"
      >
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center neon-glow">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">NEON ALPHA</h1>
              <p className="text-xs text-gray-500">Free Trading Signals</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
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
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="glass rounded-lg p-4 mb-3">
            <p className="text-sm text-gray-400 mb-3">
              Get full access to all features
            </p>
            <NavLink
              to="/login"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:opacity-90 transition-all"
            >
              <LogIn size={20} />
              <span className="font-medium">Sign In / Sign Up</span>
            </NavLink>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 glass border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
              <span className="text-sm text-gray-400">Live Market Data</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Free Tier</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
