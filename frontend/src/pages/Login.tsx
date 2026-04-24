import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Chrome, Apple } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { subscriptionService } from '../services/subscriptionService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth, checkAutoLogin } = useAuthStore()

  // Auto-login check on mount
  useEffect(() => {
    const isLoggedIn = checkAutoLogin()
    if (isLoggedIn) {
      navigate('/dashboard')
    }
  }, [checkAutoLogin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      subscriptionService.clearCache() // Clear cache to fetch fresh subscription status
      setAuth(data.token, data.user, rememberMe)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    const width = 500
    const height = 600
    const left = window.innerWidth / 2 - width / 2
    const top = window.innerHeight / 2 - height / 2
    
    // OAuth URLs - these need to be configured with actual OAuth providers
    const oauthUrls: { [key: string]: string } = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      apple: 'https://appleid.apple.com/auth/authorize'
    }
    
    // In production, these would be actual OAuth URLs with client_id, redirect_uri, etc.
    // For now, we'll open a popup that would handle the OAuth flow
    const popup = window.open(
      oauthUrls[provider] || '',
      'Social Login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )
    
    // Listen for the popup to close
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup)
        // In production, you would handle the OAuth callback here
        // For now, we'll show a message that OAuth needs to be configured
        alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth needs to be configured with proper credentials.\n\nPlease set up OAuth in the backend with your Google/Apple developer credentials.`)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gradient mb-2">NEON ALPHA</h1>
          <p className="text-gray-400">Professional Trading Terminal</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <LogIn className="text-neon-cyan" size={24} />
            <h2 className="text-2xl font-bold">Sign In</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                placeholder="trader@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-dark-700 text-neon-cyan focus:ring-neon-cyan"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-neon-cyan hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-800 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors border border-gray-600"
            >
              <Chrome size={20} className="text-white" />
              <span className="text-sm text-gray-300">Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin('apple')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors border border-gray-600"
            >
              <Apple size={20} className="text-white" />
              <span className="text-sm text-gray-300">Apple</span>
            </button>
          </div>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-neon-cyan hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
