import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Key, Smartphone, AlertTriangle, Copy, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function MobileSecurity() {
  const [activeSection, setActiveSection] = useState<'menu' | 'password' | '2fa' | 'api' | 'sessions'>('menu')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState('')
  const [twoFactorUri, setTwoFactorUri] = useState('')
  const [apiKeys, setApiKeys] = useState<{ key: string; name: string; created: string }[]>([])
  const [showNewKey, setShowNewKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')

  useEffect(() => {
    const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setTwoFactorSecret(secret.toUpperCase())
    setTwoFactorUri(`otpauth://totp/NeonAlpha:user@example.com?secret=${secret.toUpperCase()}&issuer=NeonAlpha`)
  }, [])

  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Fill in all fields')
      setPasswordSuccess(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match')
      setPasswordSuccess(false)
      return
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Min 8 characters')
      setPasswordSuccess(false)
      return
    }
    setPasswordMessage('Password updated!')
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
    setActiveSection('menu')
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

  const menuItems = [
    { id: 'password', icon: Lock, label: 'Change Password', desc: 'Update your password', color: 'trading-cyan' },
    { id: '2fa', icon: Smartphone, label: 'Two-Factor Auth', desc: twoFactorEnabled ? 'Enabled' : 'Disabled', color: twoFactorEnabled ? 'trading-profit' : 'trading-loss' },
    { id: 'api', icon: Key, label: 'API Keys', desc: `${apiKeys.length} keys active`, color: 'trading-gold' },
    { id: 'sessions', icon: Shield, label: 'Active Sessions', desc: '1 device active', color: 'trading-cyan' },
  ]

  return (
    <div className="h-full flex flex-col bg-dark-950">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-800 bg-dark-900">
        {activeSection !== 'menu' && (
          <button onClick={() => setActiveSection('menu')} className="p-2 -ml-2 rounded-lg active:bg-dark-800">
            <ChevronLeft size={24} className="text-gray-400" />
          </button>
        )}
        <Shield size={24} className="text-trading-cyan" />
        <div>
          <h1 className="text-lg font-bold text-white">
            {activeSection === 'menu' ? 'Security' : menuItems.find(i => i.id === activeSection)?.label}
          </h1>
          <p className="text-xs text-gray-400">
            {activeSection === 'menu' ? 'Protect your account' : 'Tap back to return'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeSection === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 space-y-3"
            >
              {/* Security Status Card */}
              <div className="bg-gradient-to-br from-trading-cyan/20 to-trading-blue/20 rounded-2xl p-4 border border-trading-cyan/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-trading-cyan/20 flex items-center justify-center">
                    <Shield size={24} className="text-trading-cyan" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Security Score</h2>
                    <p className="text-sm text-trading-cyan font-semibold">{twoFactorEnabled ? 'Strong' : 'Medium'}</p>
                  </div>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-2 mt-3">
                  <div className={`h-2 rounded-full ${twoFactorEnabled ? 'bg-trading-profit w-full' : 'bg-trading-gold w-2/3'}`} />
                </div>
              </div>

              {/* Menu Items */}
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className="w-full flex items-center gap-4 p-4 bg-dark-900 rounded-2xl border border-dark-800 active:bg-dark-800 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl bg-${item.color}/20 flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={22} className={`text-${item.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white">{item.label}</h3>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                  <ChevronLeft size={20} className="text-gray-500 rotate-180" />
                </button>
              ))}

              {/* Recommendations */}
              {!twoFactorEnabled && (
                <div className="bg-trading-gold/10 border border-trading-gold/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={18} className="text-trading-gold" />
                    <span className="font-semibold text-trading-gold text-sm">Recommendation</span>
                  </div>
                  <p className="text-sm text-gray-400">Enable 2FA for stronger account security</p>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-trading-cyan"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-trading-cyan"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-trading-cyan"
                  />
                </div>
                {passwordMessage && (
                  <p className={`text-sm ${passwordSuccess ? 'text-trading-profit' : 'text-trading-loss'}`}>
                    {passwordMessage}
                  </p>
                )}
                <button
                  onClick={handlePasswordUpdate}
                  className="w-full bg-gradient-to-r from-trading-cyan to-trading-blue text-dark-950 font-bold py-4 rounded-xl active:opacity-90"
                >
                  Update Password
                </button>
              </div>
            </motion.div>
          )}

          {activeSection === '2fa' && (
            <motion.div
              key="2fa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {show2FASetup ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 flex items-center justify-center">
                    {twoFactorUri && <QRCodeSVG value={twoFactorUri} size={200} level="H" />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Scan with authenticator app</p>
                    <code className="bg-dark-900 px-4 py-2 rounded-lg text-trading-cyan font-mono text-sm block break-all">
                      {twoFactorSecret}
                    </code>
                  </div>
                  <button
                    onClick={handleEnable2FA}
                    className="w-full bg-trading-profit text-dark-950 font-bold py-4 rounded-xl"
                  >
                    Enable 2FA
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-dark-900 rounded-2xl p-4 border border-dark-800">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-white">2FA Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        twoFactorEnabled ? 'bg-trading-profit/20 text-trading-profit' : 'bg-trading-loss/20 text-trading-loss'
                      }`}>
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      {twoFactorEnabled 
                        ? 'Your account is protected with two-factor authentication'
                        : 'Add an extra layer of security to your account'}
                    </p>
                    <button
                      onClick={handle2FAToggle}
                      className={`w-full py-4 rounded-xl font-bold ${
                        twoFactorEnabled 
                          ? 'bg-trading-loss/20 text-trading-loss border border-trading-loss/50' 
                          : 'bg-gradient-to-r from-trading-cyan to-trading-blue text-dark-950'
                      }`}
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'api' && (
            <motion.div
              key="api"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {showNewKey && (
                <div className="bg-trading-profit/10 border border-trading-profit/30 rounded-2xl p-4">
                  <p className="text-sm text-trading-profit mb-2">New API Key Generated</p>
                  <code className="text-xs bg-dark-900 px-3 py-2 rounded text-gray-300 block break-all">{newApiKey}</code>
                  <p className="text-xs text-gray-500 mt-2">Save this key now. You won&apos;t see it again.</p>
                </div>
              )}

              {apiKeys.map((apiKey, index) => (
                <div key={index} className="bg-dark-900 rounded-2xl p-4 border border-dark-800 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white text-sm">{apiKey.name}</p>
                    <code className="text-xs text-gray-400">{apiKey.key.substring(0, 16)}...</code>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleCopyApiKey(apiKey.key)} className="p-2 rounded-lg bg-dark-800">
                      <Copy size={16} className="text-gray-400" />
                    </button>
                    <button onClick={() => handleRevokeApiKey(index)} className="p-2 rounded-lg bg-trading-loss/20">
                      <AlertTriangle size={16} className="text-trading-loss" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleGenerateApiKey}
                className="w-full bg-dark-900 border border-dark-700 text-white font-bold py-4 rounded-xl active:bg-dark-800"
              >
                Generate New API Key
              </button>
            </motion.div>
          )}

          {activeSection === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-dark-900 rounded-2xl p-4 border border-dark-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">This Device</p>
                    <p className="text-sm text-gray-400">iPhone • Chrome</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-trading-profit/20 text-trading-profit">Active</span>
                </div>
              </div>
              <button className="w-full bg-trading-loss/20 text-trading-loss font-bold py-4 rounded-xl border border-trading-loss/50">
                Revoke All Other Sessions
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
