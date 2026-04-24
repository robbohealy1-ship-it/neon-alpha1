import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Pricing from './pages/Pricing'
import Dashboard from './pages/Dashboard'
import Signals from './pages/Signals'
import TradeSetups from './pages/TradeSetups'
import Journal from './pages/Journal'
import SignalJournal from './pages/SignalJournal'
import SetupHistory from './pages/SetupHistory'
import Watchlist from './pages/Watchlist'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import HelpCenter from './pages/HelpCenter'
import Security from './pages/Security'
import Billing from './pages/Billing'
import AlphaPicks from './pages/AlphaPicks'
import Layout from './components/Layout'
import './i18n'

function App() {
  const { token } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page - accessible to all users */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!token ? <Signup /> : <Navigate to="/dashboard" />} />
        
        {/* Public feature pages - accessible but with paywall/blur for free users */}
        <Route element={<Layout />}>
          <Route path="/signals" element={<Signals />} />
          <Route path="/alpha-picks" element={<AlphaPicks />} />
        </Route>
        
        {/* Protected routes - require login */}
        <Route element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setups" element={<TradeSetups />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/signal-journal" element={<SignalJournal />} />
          <Route path="/setup-history" element={<SetupHistory />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/security" element={<Security />} />
          <Route path="/billing" element={<Billing />} />
        </Route>
        
        {/* Catch all - show landing page */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
