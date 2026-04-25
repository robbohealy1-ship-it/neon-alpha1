import { motion } from 'framer-motion'
import { User, Bell, Moon, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const [displayName, setDisplayName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [tradeSignals, setTradeSignals] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Load settings from localStorage on mount
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '')
      setEmail(user.email || '')
    }

    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      if (settings.displayName) setDisplayName(settings.displayName)
      if (settings.email) setEmail(settings.email)
      if (settings.priceAlerts !== undefined) setPriceAlerts(settings.priceAlerts)
      if (settings.tradeSignals !== undefined) setTradeSignals(settings.tradeSignals)
      if (settings.emailUpdates !== undefined) setEmailUpdates(settings.emailUpdates)
      if (settings.theme) setTheme(settings.theme)
      if (settings.language) {
        setLanguage(settings.language)
        i18n.changeLanguage(settings.language)
      }
      
      // Apply theme to document
      applyTheme(settings.theme || 'dark')
    }
  }, [i18n, user])

  const applyTheme = (themeValue: string) => {
    const html = document.documentElement
    if (themeValue === 'light') {
      html.classList.add('light')
      html.classList.remove('dark')
    } else {
      html.classList.add('dark')
      html.classList.remove('light')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setErrorMessage('')

    try {
      const profileResponse = await api.put('/user/profile', {
        name: displayName,
        email,
      })

      updateUser({
        name: profileResponse.data.name,
        email: profileResponse.data.email,
        subscriptionTier: profileResponse.data.subscriptionTier,
      })
    } catch (error: any) {
      setSaving(false)
      setErrorMessage(error?.response?.data?.error || 'Failed to save profile')
      return
    }
    
    // Save to localStorage
    const settings = {
      displayName,
      email,
      priceAlerts,
      tradeSignals,
      emailUpdates,
      theme,
      language
    }
    localStorage.setItem('userSettings', JSON.stringify(settings))
    
    // Apply theme immediately
    applyTheme(theme)
    
    // Apply language change
    i18n.changeLanguage(language)
    localStorage.setItem('userLanguage', language)
    
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 overflow-y-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-1 sm:mb-2">{t('settings')}</h1>
          <p className="text-sm sm:text-base text-gray-400">{t('managePreferences')}</p>
          {errorMessage && <p className="text-neon-red mt-2 text-sm">{errorMessage}</p>}
        </div>
        {saved && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-neon-green"
          >
            <CheckCircle size={18} className="sm:w-5 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">{t('saved')}</span>
          </motion.div>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <User className="text-neon-cyan" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold">{t('account')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">{t('displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Bell className="text-neon-cyan" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold">{t('notifications')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">{t('priceAlerts')}</p>
                <p className="text-xs sm:text-sm text-gray-400 truncate">{t('priceAlertsDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" checked={priceAlerts} onChange={(e) => setPriceAlerts(e.target.checked)} className="sr-only peer" />
                <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('tradeSignals')}</p>
                <p className="text-sm text-gray-400">{t('tradeSignalsDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={tradeSignals} onChange={(e) => setTradeSignals(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('emailUpdates')}</p>
                <p className="text-sm text-gray-400">{t('emailUpdatesDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={emailUpdates} onChange={(e) => setEmailUpdates(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Moon className="text-neon-cyan" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold">{t('appearance')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">{t('theme')}</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-neon-cyan transition-colors"
              >
                <option value="dark">{t('darkMode')}</option>
                <option value="light">{t('lightMode')}</option>
                <option value="auto">{t('systemDefault')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">{t('language')}</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-neon-cyan transition-colors"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-0"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-animate text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 neon-glow text-sm sm:text-base"
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
