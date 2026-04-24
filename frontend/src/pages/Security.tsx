import { motion } from 'framer-motion'
import { Shield, Lock, Key, Smartphone, AlertTriangle, Copy, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorUri, setTwoFactorUri] = useState('')

  // Generate 2FA secret on component mount
  useEffect(() => {
    // Generate a random secret (in production, this comes from backend)
    const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setTwoFactorSecret(secret.toUpperCase())
    // Generate otpauth URI
    const uri = `otpauth://totp/NeonAlpha:user@example.com?secret=${secret.toUpperCase()}&issuer=NeonAlpha`
    setTwoFactorUri(uri)
  }, [])

  const [apiKeys, setApiKeys] = useState<{ key: string; name: string; created: string }[]>([])
  const [showNewKey, setShowNewKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')

  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all fields')
      setPasswordSuccess(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match')
      setPasswordSuccess(false)
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters')
      setPasswordSuccess(false)
      return
    }

    // Simulate password update
    setPasswordMessage('Password updated successfully')
    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordMessage(''), 3000)
  }

  const handle2FAToggle = () => {
    if (!twoFactorEnabled) {
      setShow2FASetup(true)
    } else {
      setTwoFactorEnabled(false)
    }
  }

  const handleEnable2FA = () => {
    setTwoFactorEnabled(true)
    setShow2FASetup(false)
  }

  const handleGenerateApiKey = () => {
    const key = `na_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    setNewApiKey(key)
    setShowNewKey(true)
    setApiKeys([...apiKeys, { key, name: 'API Key ' + (apiKeys.length + 1), created: new Date().toISOString() }])
  }

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  const handleRevokeApiKey = (index: number) => {
    setApiKeys(apiKeys.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Security</h1>
        <p className="text-gray-400">Manage your account security settings</p>
      </div>

      <div className="grid gap-6">
        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lock className="text-neon-cyan" size={24} />
            <h2 className="text-xl font-semibold">Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
            {passwordMessage && (
              <p className={`text-sm ${passwordSuccess ? 'text-neon-green' : 'text-red-400'}`}>
                {passwordMessage}
              </p>
            )}
            <button 
              onClick={handlePasswordUpdate}
              className="bg-gradient-animate text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity neon-glow"
            >
              Update Password
            </button>
          </div>
        </motion.div>

        {/* Two-Factor Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="text-neon-cyan" size={24} />
            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          </div>
          <div className="space-y-4">
            {show2FASetup ? (
              <div className="p-4 bg-dark-700 rounded-lg">
                <p className="text-sm text-gray-400 mb-4">
                  Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center p-2">
                  {twoFactorUri && <QRCodeSVG value={twoFactorUri} size={176} level="H" />}
                </div>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-400 mb-2">Or enter this code manually:</p>
                  <code className="bg-dark-600 px-3 py-1 rounded text-neon-cyan font-mono text-sm">{twoFactorSecret}</code>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleEnable2FA}
                    className="flex-1 bg-gradient-animate text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity neon-glow"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => setShow2FASetup(false)}
                    className="flex-1 bg-dark-600 text-white font-semibold py-3 rounded-lg hover:bg-dark-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${twoFactorEnabled ? 'bg-neon-green/10 text-neon-green' : 'bg-red-400/10 text-red-400'}`}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Add an extra layer of security to your account</p>
                <button 
                  onClick={handle2FAToggle}
                  className={`${twoFactorEnabled ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20' : 'bg-neon-cyan text-dark-900'} font-semibold py-3 px-6 rounded-lg transition-opacity`}
                >
                  {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* API Keys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Key className="text-neon-cyan" size={24} />
            <h2 className="text-xl font-semibold">API Keys</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Manage API keys for programmatic access to your account</p>
            
            {showNewKey && (
              <div className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neon-green mb-1">New API Key Generated</p>
                    <code className="text-xs bg-dark-700 px-2 py-1 rounded">{newApiKey}</code>
                  </div>
                  <button 
                    onClick={() => setShowNewKey(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Save this key securely. You won't be able to see it again.</p>
              </div>
            )}

            {apiKeys.length > 0 && (
              <div className="space-y-2">
                {apiKeys.map((apiKey, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{apiKey.name}</p>
                      <code className="text-xs text-gray-400">{apiKey.key.substring(0, 20)}...</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCopyApiKey(apiKey.key)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={() => handleRevokeApiKey(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={handleGenerateApiKey}
              className="bg-dark-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-dark-600 transition-colors"
            >
              Generate New API Key
            </button>
          </div>
        </motion.div>

        {/* Active Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-neon-cyan" size={24} />
            <h2 className="text-xl font-semibold">Active Sessions</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <div>
                <p className="font-medium">Windows - Chrome</p>
                <p className="text-sm text-gray-400">Current session • Last active now</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neon-green/10 text-neon-green">Active</span>
            </div>
            <button className="w-full text-red-400 font-semibold py-3 rounded-lg hover:bg-red-500/10 transition-colors">
              Revoke All Other Sessions
            </button>
          </div>
        </motion.div>

        {/* Security Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6 border border-yellow-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-yellow-500" size={24} />
            <h2 className="text-xl font-semibold text-yellow-500">Security Recommendations</h2>
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Enable Two-Factor Authentication for enhanced security
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Use a strong, unique password for your account
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Review active sessions regularly
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
