import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Lock, Crown, TrendingUp, Target, Shield, 
  ChevronRight, ChevronDown, X, AlertTriangle, BookOpen,
  BarChart3, Filter, Bookmark, Flame, Brain, GitGraph
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccessControl } from '../utils/accessControl';
import { useSubscription } from '../hooks/useSubscription';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface AlphaPick {
  id: string;
  coinName: string;
  ticker: string;
  sector: string;
  marketCapCategory: 'LOW' | 'MID' | 'HIGH';
  confidenceScore: number;
  status: 'ACCUMULATING' | 'WATCHING' | 'COMPLETED';
  thesisPreview: string;
  executiveSummary: string[];
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AlphaPickDetail extends AlphaPick {
  thesis: string;
  narrative: string;
  fundamentals: {
    useCase: string;
    tokenomics: Record<string, string>;
    teamInvestors: Record<string, any>;
    competitiveEdge: string;
  };
  onChainData: Record<string, string>;
  technicals: {
    marketStructure: 'bullish' | 'bearish' | 'neutral';
    accumulationZones: number[];
    liquidityAreas: {
      demandZones: string[];
      liquiditySweeps: string;
      structure: string;
    };
  };
  executionPlan: string;
  invalidation: number;
  timeHorizon: 'SWING' | 'POSITION' | 'LONG_TERM';
  targets: {
    tp1: number;
    tp2: number;
    tp3: number;
  };
  catalysts: string[];
  risks: string[];
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const SECTORS = ['AI', 'DeFi', 'L2', 'Meme', 'RWA', 'Gaming', 'Infrastructure', 'DePIN'];
const CATEGORIES = ['LOW', 'MID', 'HIGH'];
const STATUSES = ['ACCUMULATING', 'WATCHING', 'COMPLETED'];

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  expandedSection: string | null;
  onToggle: (id: string) => void;
  children: ReactNode;
}

function CollapsibleSection({ id, title, icon, expandedSection, onToggle, children }: CollapsibleSectionProps) {
  const isOpen = expandedSection === id;

  return (
    <section className="glass rounded-xl border border-gray-700/50 overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-xl font-bold text-white">
          {icon}
          {title}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function AlphaPicksContent() {
  const [picks, setPicks] = useState<AlphaPick[]>([]);
  const [filteredPicks, setFilteredPicks] = useState<AlphaPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPick, setSelectedPick] = useState<AlphaPickDetail | null>(null);
  const { canViewAlphaPicks } = useAccessControl();
  const subscriptionHook = useSubscription();
  const refreshSubscription = subscriptionHook.refresh;
  const subscription = subscriptionHook.subscription;
  const subscriptionPlan = subscriptionHook.plan;
  const navigate = useNavigate();
  const authToken = useAuthStore((state) => state.token);
  
  // Filters
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [scanStatus, setScanStatus] = useState<any>(null);
  
  // Bookmarks
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('executive-summary');

  // Fetch scan status
  useEffect(() => {
    if (canViewAlphaPicks) {
      api.get('/alpha-picks/scanner-info').then(response => {
        setScanStatus(response.data);
      }).catch(() => {
        // Silently fail - not critical
      });
    }
  }, [canViewAlphaPicks]);

  // Force refresh subscription on mount to ensure we have latest tier data
  useEffect(() => {
    console.log('[AlphaPicks] Before refresh - subscription:', subscription, 'plan:', subscriptionPlan);
    refreshSubscription().then(() => {
      // State will update asynchronously, log in a separate effect
      console.log('[AlphaPicks] Refresh completed (state updating async)');
    });
  }, []);

  // Log when subscription changes
  useEffect(() => {
    console.log('[AlphaPicks] Subscription updated:', subscription, 'plan:', subscriptionPlan);
  }, [subscription, subscriptionPlan]);

  useEffect(() => {
    loadPicks();
  }, [subscriptionPlan, authToken]);

  const loadPicks = async () => {
    try {
      setLoading(true);
      const token = authToken;
      console.log('[loadPicks] Starting, token exists:', !!token, 'subscriptionPlan:', subscriptionPlan, 'canViewAlphaPicks:', canViewAlphaPicks);
      let data;

      if (!token) {
        // Public preview - no auth required
        console.log('[loadPicks] No token, using public preview');
        const response = await api.get('/alpha-picks/public/preview');
        data = response.data.preview || [];
        setError('PRO_REQUIRED');
      } else {
        // Try full endpoint for logged-in users
        console.log('[loadPicks] Token exists, trying /alpha-picks');
        try {
          const response = await api.get('/alpha-picks');
          console.log('[loadPicks] /alpha-picks success:', response.data);
          data = response.data.picks || [];
          setBookmarks(data.filter((p: AlphaPick) => p.isBookmarked).map((p: AlphaPick) => p.id));
          setError(null);
        } catch (err: any) {
          console.log('[loadPicks] /alpha-picks error:', err.response?.status, err.response?.data);
          if (err.response?.status === 401 || err.response?.status === 403) {
            console.log('[loadPicks] Fallback to public preview due to 401/403');
            const response = await api.get('/alpha-picks/public/preview');
            data = response.data.preview || [];
            setError('PRO_REQUIRED');
          } else {
            throw err;
          }
        }
      }

      setPicks(data);
      setFilteredPicks(data);
    } catch (err: any) {
      console.error('Failed to load Alpha Picks:', err);
      setError('Failed to load Alpha Picks');
      setPicks([]);
      setFilteredPicks([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters
  useEffect(() => {
    let filtered = [...picks];
    
    if (sectorFilter !== 'ALL') {
      filtered = filtered.filter(p => p.sector === sectorFilter);
    }
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(p => p.marketCapCategory === categoryFilter);
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (minConfidence > 0) {
      filtered = filtered.filter(p => p.confidenceScore >= minConfidence);
    }
    
    setFilteredPicks(filtered);
  }, [picks, sectorFilter, categoryFilter, statusFilter, minConfidence]);
  
  // Load pick detail
  const loadPickDetail = async (id: string) => {
    try {
      const response = await api.get(`/alpha-picks/${id}`);
      setSelectedPick(response.data);
      setExpandedSection('executive-summary');
    } catch (err) {
      console.error('Failed to load pick detail:', err);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(current => current === sectionId ? null : sectionId);
  };

  // Toggle bookmark
  const toggleBookmark = async (id: string, e?: ReactMouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    try {
      if (bookmarks.includes(id)) {
        await api.delete(`/alpha-picks/${id}/bookmark`);
        setBookmarks(bookmarks.filter(b => b !== id));
      } else {
        await api.post(`/alpha-picks/${id}/bookmark`);
        setBookmarks([...bookmarks, id]);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  // Status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCUMULATING': return 'bg-neon-green/20 text-neon-green border-neon-green/30';
      case 'WATCHING': return 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30';
      case 'COMPLETED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      'AI': 'bg-purple-500/20 text-purple-400',
      'DeFi': 'bg-blue-500/20 text-blue-400',
      'L2': 'bg-green-500/20 text-green-400',
      'Meme': 'bg-pink-500/20 text-pink-400',
      'RWA': 'bg-yellow-500/20 text-yellow-400',
      'Gaming': 'bg-red-500/20 text-red-400',
      'Infrastructure': 'bg-cyan-500/20 text-cyan-400',
      'DePIN': 'bg-orange-500/20 text-orange-400'
    };
    return colors[sector] || 'bg-gray-500/20 text-gray-400';
  };

  // Debug: Log current permission state on every render
  console.log('[AlphaPicks] Render check - canViewAlphaPicks:', canViewAlphaPicks, 'subscriptionPlan:', subscriptionPlan);

  // PRO Paywall View
  if (!canViewAlphaPicks) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-dark-900">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-neon-purple/20 to-pink-500/20 border border-neon-purple/30 mb-6">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              <span className="text-sm font-bold bg-gradient-to-r from-neon-purple to-pink-500 bg-clip-text text-transparent">INSTITUTIONAL RESEARCH</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight">
              Alpha Picks
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Hedge-fund-grade crypto research combining narrative analysis, 
              on-chain data, and executable accumulation strategies.
            </p>
          </div>

          {/* Preview Grid - Blurred */}
          <div className="relative mb-16">
            <div className="grid md:grid-cols-3 gap-6 blur-md pointer-events-none select-none">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-2xl p-6 border border-gray-700/50">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">AI</span>
                      <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs">MID CAP</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-white font-semibold">82%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    Chain abstraction thesis gaining traction with AI positioning at intersection of mega-trends...
                  </p>
                </div>
              ))}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-10 text-center border border-neon-purple/30 bg-dark-800/95 backdrop-blur-xl"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-neon-purple to-pink-500 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Alpha Access Exclusive</h3>
                <p className="text-gray-400 mb-8 max-w-md text-lg">
                  Unlock institutional-grade research with full accumulation strategies, 
                  on-chain analysis, and execution plans.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-8 py-4 bg-gradient-to-r from-neon-purple to-pink-500 rounded-xl font-bold text-white hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade to Active Trader
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-6">
                  Active Trader: 3 picks/day • Alpha Access: Unlimited • 14-day guarantee
                </p>
              </motion.div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: 'Narrative Analysis', desc: 'Understand why this coin matters NOW' },
              { icon: GitGraph, title: 'On-Chain Data', desc: 'Wallet growth, whale movements, flows' },
              { icon: Target, title: 'Accumulation Zones', desc: 'Exact entry levels with invalidation' },
              { icon: Shield, title: 'Risk Assessment', desc: 'What could go wrong & bear case' }
            ].map((feature, i) => (
              <div key={i} className="glass rounded-xl p-6 border border-gray-700/30 hover:border-neon-purple/30 transition-colors">
                <feature.icon className="w-8 h-8 text-neon-purple mb-4" />
                <h4 className="font-bold text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-dark-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-purple to-pink-500 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Alpha Picks</h1>
                <p className="text-gray-400">High-conviction crypto accumulation research</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl hover:border-neon-cyan/30 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Filters</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-neon-purple/20 to-pink-500/20 border border-neon-purple/30">
              <Crown className="w-4 h-4 text-neon-purple" />
              <span className="text-sm font-bold text-neon-purple">PRO</span>
            </div>
          </div>
        </div>

        {/* Scan Schedule Info */}
        {scanStatus && (
          <div className="mb-4 p-3 rounded-lg bg-dark-800/50 border border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <span>Auto-scan every 5 days • Next scan in <span className="text-neon-cyan font-semibold">{scanStatus.daysUntilNext} days</span></span>
            </div>
            <span className="text-xs text-gray-500">Generates 1-2 fresh picks per scan</span>
          </div>
        )}

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="glass rounded-2xl p-6 border border-gray-700/50">
                <div className="grid md:grid-cols-4 gap-6">
                  {/* Sector Filter */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Sector</label>
                    <select
                      value={sectorFilter}
                      onChange={(e) => setSectorFilter(e.target.value)}
                      className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-cyan outline-none"
                    >
                      <option value="ALL">All Sectors</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  {/* Category Filter */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Market Cap</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-cyan outline-none"
                    >
                      <option value="ALL">All Caps</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-cyan outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  
                  {/* Confidence Filter */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      Min Confidence: {minConfidence}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                      className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400 text-sm">
            Showing <span className="text-white font-semibold">{filteredPicks.length}</span> research reports
          </p>
          {filteredPicks.length !== picks.length && (
            <button
              onClick={() => {
                setSectorFilter('ALL');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setMinConfidence(0);
              }}
              className="text-sm text-neon-cyan hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading Alpha Picks...</div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadPicks}
              className="mt-4 px-4 py-2 glass rounded-lg text-white hover:border-neon-cyan/50"
            >
              Retry
            </button>
          </div>
        ) : filteredPicks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No Alpha Picks match your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPicks.map((pick, index) => (
              <motion.div
                key={pick.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6 border border-gray-700/50 hover:border-neon-purple/50 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => loadPickDetail(pick.id)}
              >
                {/* Bookmark Button */}
                <button
                  onClick={(e) => toggleBookmark(pick.id, e)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-dark-700/50 transition-colors z-10"
                >
                  <Bookmark 
                    className={`w-5 h-5 ${bookmarks.includes(pick.id) ? 'text-neon-yellow fill-neon-yellow' : 'text-gray-500'}`} 
                  />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold text-xl">
                    {pick.ticker[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg group-hover:text-neon-purple transition-colors">
                      {pick.coinName}
                    </div>
                    <div className="text-sm text-gray-400">{pick.ticker}</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSectorColor(pick.sector)}`}>
                    {pick.sector}
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs">
                    {pick.marketCapCategory} CAP
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(pick.status)}`}>
                    {pick.status}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(pick.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Executive Summary Preview */}
                {pick.executiveSummary && pick.executiveSummary.length > 0 && (
                  <div className="mb-4">
                    <ul className="space-y-1">
                      {pick.executiveSummary.slice(0, 2).map((point, i) => (
                        <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-neon-cyan mt-1">•</span>
                          <span className="line-clamp-2">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Confidence Score</span>
                    <span className="text-neon-purple font-bold">{pick.confidenceScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pick.confidenceScore}%` }}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-neon-purple to-pink-500"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(pick.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-neon-purple text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Research
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPick(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-neon-purple/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-dark-800/95 backdrop-blur-lg border-b border-gray-800 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold text-xl">
                    {selectedPick.ticker[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{selectedPick.coinName}</h2>
                      <span className="text-gray-400">({selectedPick.ticker})</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSectorColor(selectedPick.sector)}`}>
                        {selectedPick.sector}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedPick.status)}`}>
                        {selectedPick.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400">
                        {selectedPick.marketCapCategory} CAP
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        Updated: {new Date(selectedPick.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => toggleBookmark(selectedPick.id, e)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <Bookmark 
                      className={`w-6 h-6 ${bookmarks.includes(selectedPick.id) ? 'text-neon-yellow fill-neon-yellow' : 'text-gray-400'}`} 
                    />
                  </button>
                  <button
                    onClick={() => setSelectedPick(null)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* SECTION 1: Executive Summary */}
                <div className="glass rounded-2xl p-6 border border-gray-700/50 bg-gradient-to-r from-neon-purple/5 to-transparent">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                    <Sparkles className="w-5 h-5 text-neon-purple" />
                    Executive Summary
                  </h3>
                  <ul className="space-y-3">
                    {selectedPick.executiveSummary?.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300">
                        <span className="w-6 h-6 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="glass rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-neon-purple">{selectedPick.confidenceScore}%</div>
                    <div className="w-full h-1 bg-dark-700 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-neon-purple to-pink-500 rounded-full"
                        style={{ width: `${selectedPick.confidenceScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Horizon</div>
                    <div className="text-xl font-bold text-white">{selectedPick.timeHorizon}</div>
                    <div className="text-xs text-gray-500 mt-1">Position sizing</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Invalidation</div>
                    <div className="text-xl font-bold text-neon-red">${selectedPick.invalidation}</div>
                    <div className="text-xs text-gray-500 mt-1">Stop loss</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Structure</div>
                    <div className={`text-xl font-bold capitalize ${
                      selectedPick.technicals?.marketStructure === 'bullish' ? 'text-neon-green' :
                      selectedPick.technicals?.marketStructure === 'bearish' ? 'text-neon-red' :
                      'text-neon-yellow'
                    }`}>
                      {selectedPick.technicals?.marketStructure}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Market bias</div>
                  </div>
                </div>

                {/* SECTION 2: Investment Thesis */}
                <CollapsibleSection
                  id="investment-thesis"
                  title="Investment Thesis"
                  icon={<Target className="w-6 h-6 text-neon-cyan" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">{selectedPick.thesis}</p>
                  </div>
                </CollapsibleSection>

                {/* SECTION 3: Market Narrative */}
                <CollapsibleSection
                  id="market-narrative"
                  title="Market Narrative"
                  icon={<BarChart3 className="w-6 h-6 text-neon-purple" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="glass rounded-xl p-6 border border-gray-700/50">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">{selectedPick.narrative}</p>
                  </div>
                </CollapsibleSection>

                {/* SECTION 4: Fundamentals */}
                <CollapsibleSection
                  id="fundamentals"
                  title="Fundamentals"
                  icon={<BookOpen className="w-6 h-6 text-neon-green" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    {/* Use Case */}
                    <div className="glass rounded-xl p-5 border border-gray-700/50">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                        Use Case
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{selectedPick.fundamentals?.useCase}</p>
                    </div>
                    
                    {/* Tokenomics */}
                    <div className="glass rounded-xl p-5 border border-gray-700/50">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-purple" />
                        Tokenomics
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {selectedPick.fundamentals?.tokenomics && Object.entries(selectedPick.fundamentals.tokenomics).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Team & Investors */}
                    <div className="glass rounded-xl p-5 border border-gray-700/50">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-yellow" />
                        Team & Backers
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedPick.fundamentals?.teamInvestors && Object.entries(selectedPick.fundamentals.teamInvestors).map(([key, value]: [string, any]) => (
                          <div key={key}>
                            <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="text-white ml-2">
                              {Array.isArray(value) ? value.join(', ') : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Competitive Edge */}
                    <div className="glass rounded-xl p-5 border border-gray-700/50">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-green" />
                        Competitive Advantage
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{selectedPick.fundamentals?.competitiveEdge}</p>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* SECTION 5: On-Chain Data */}
                <CollapsibleSection
                  id="on-chain-data"
                  title="On-Chain & Data Edge"
                  icon={<GitGraph className="w-6 h-6 text-neon-cyan" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="glass rounded-xl p-5 border border-gray-700/50">
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedPick.onChainData && Object.entries(selectedPick.onChainData).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-start gap-3">
                          <span className="w-2 h-2 rounded-full bg-neon-cyan mt-2 shrink-0" />
                          <div>
                            <span className="text-gray-400 text-sm capitalize block mb-1">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-white text-sm">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* SECTION 6: Technical Accumulation */}
                <CollapsibleSection
                  id="technical-accumulation"
                  title="Technical Accumulation Zones"
                  icon={<TrendingUp className="w-6 h-6 text-neon-yellow" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    {/* Accumulation Zones */}
                    <div className="glass rounded-xl p-5 border border-gray-700/50">
                      <h4 className="font-semibold text-white mb-3">Key Accumulation Levels</h4>
                      <div className="flex flex-wrap gap-3">
                        {selectedPick.technicals?.accumulationZones?.map((zone: number, i: number) => (
                          <div key={i} className="px-4 py-2 rounded-lg bg-neon-green/10 border border-neon-green/30">
                            <span className="text-neon-green font-bold">${zone.toFixed(2)}</span>
                            <span className="text-xs text-gray-500 ml-2">Tranche {i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Liquidity Areas */}
                    <div className="glass rounded-xl p-5 border border-gray-700/50">
                      <h4 className="font-semibold text-white mb-3">Liquidity Analysis</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400 text-sm">Demand Zones: </span>
                          <span className="text-white">
                            {selectedPick.technicals?.liquidityAreas?.demandZones?.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Recent Sweeps: </span>
                          <span className="text-white">{selectedPick.technicals?.liquidityAreas?.liquiditySweeps}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Structure: </span>
                          <span className="text-white">{selectedPick.technicals?.liquidityAreas?.structure}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* SECTION 7: Execution Plan */}
                <CollapsibleSection
                  id="execution-plan"
                  title="Execution Plan"
                  icon={<Shield className="w-6 h-6 text-neon-cyan" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="glass rounded-xl p-6 border border-neon-cyan/30 bg-neon-cyan/5">
                    <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedPick.executionPlan}
                    </pre>
                  </div>
                </CollapsibleSection>

                {/* SECTION 8: Targets */}
                <CollapsibleSection
                  id="price-targets"
                  title="Price Targets"
                  icon={<Target className="w-6 h-6 text-neon-green" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-5 text-center border border-neon-green/30">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Target 1</div>
                      <div className="text-2xl font-bold text-neon-green">${selectedPick.targets?.tp1}</div>
                      <div className="text-xs text-gray-500 mt-1">Take initial profits</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center border border-neon-cyan/30">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Target 2</div>
                      <div className="text-2xl font-bold text-neon-cyan">${selectedPick.targets?.tp2}</div>
                      <div className="text-xs text-gray-500 mt-1">Trim position</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center border border-neon-purple/30">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Target 3</div>
                      <div className="text-2xl font-bold text-neon-purple">${selectedPick.targets?.tp3}</div>
                      <div className="text-xs text-gray-500 mt-1">Full exit / hold core</div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* SECTION 9: Catalysts */}
                <CollapsibleSection
                  id="catalysts"
                  title="Upcoming Catalysts"
                  icon={<Flame className="w-6 h-6 text-neon-orange" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="glass rounded-xl p-5 border border-neon-orange/30 bg-neon-orange/5">
                    <ul className="space-y-3">
                      {selectedPick.catalysts?.map((catalyst: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300">
                          <span className="w-6 h-6 rounded-full bg-neon-orange/20 text-neon-orange flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span>{catalyst}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleSection>

                {/* SECTION 10: Risks */}
                <CollapsibleSection
                  id="risks"
                  title="Risk Factors & Bear Case"
                  icon={<AlertTriangle className="w-6 h-6 text-neon-red" />}
                  expandedSection={expandedSection}
                  onToggle={toggleSection}
                >
                  <div className="glass rounded-xl p-5 border border-neon-red/30 bg-neon-red/5">
                    <ul className="space-y-3">
                      {selectedPick.risks?.map((risk: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300">
                          <span className="text-neon-red mt-1">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-neon-red/20">
                      <p className="text-sm text-gray-400">
                        <strong className="text-neon-red">Invalidation Level:</strong> A close below ${selectedPick.invalidation} on the weekly timeframe invalidates this thesis.
                      </p>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Disclaimer */}
                <div className="text-xs text-gray-500 border-t border-gray-800 pt-6">
                  <strong>Disclaimer:</strong> Alpha Picks are institutional-grade research for informational purposes only. 
                  They do not constitute financial advice. Crypto investments carry significant risk including total loss of capital. 
                  Past performance does not indicate future results. Always conduct your own due diligence and only invest what you can afford to lose completely.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export the content directly - Layout uses Outlet pattern
export default AlphaPicksContent;
