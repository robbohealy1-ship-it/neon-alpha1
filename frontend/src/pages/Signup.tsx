import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Chrome, Apple } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { subscriptionService } from '../services/subscriptionService'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
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
    
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service')
      return
    }
    
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/signup', { name, email, password })
      subscriptionService.clearCache() // Clear cache to fetch fresh subscription status
      // Auto-remember on signup for convenience
      setAuth(data.token, data.user, true)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignup = async (provider: string) => {
    try {
      const mockEmail = provider === 'google' ? 'user@gmail.com' : 'user@icloud.com'
      const mockName = provider === 'google' ? 'Google User' : 'Apple User'
      
      const { data } = await api.post('/auth/social', { 
        provider, 
        email: mockEmail,
        name: mockName
      })
      
      setAuth(data.token, data.user, true)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || `${provider} signup failed`)
    }
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
            <UserPlus className="text-neon-cyan" size={24} />
            <h2 className="text-2xl font-bold">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                placeholder="Your name"
                required
              />
            </div>

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
                minLength={6}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-dark-700 text-neon-cyan focus:ring-neon-cyan"
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-neon-cyan hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-neon-cyan hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !agreeTerms}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-800 text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Signup Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialSignup('google')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors border border-gray-600"
            >
              <Chrome size={20} className="text-white" />
              <span className="text-sm text-gray-300">Google</span>
            </button>
            <button
              onClick={() => handleSocialSignup('apple')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors border border-gray-600"
            >
              <Apple size={20} className="text-white" />
              <span className="text-sm text-gray-300">Apple</span>
            </button>
          </div>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-neon-cyan hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
