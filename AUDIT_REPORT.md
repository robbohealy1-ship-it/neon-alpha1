# Neon Alpha Trading Terminal - System Audit Report

**Date:** April 21, 2026  
**Scope:** Full-stack crypto trading platform  
**Objective:** Validate functionality, logic consistency, data integrity, and production readiness

---

## ✅ WORKING CORRECTLY

### 1. Trade Setup Engine - Data Generation
- **Status:** FUNCTIONAL
- Uses CoinGecko API for real market data
- Generates setups dynamically based on price action
- 5 strategy types implemented with distinct logic:
  - Liquidity Sweep (entry near 24h highs/lows)
  - Fair Value Gap (trend continuation entries)
  - Market Structure Shift (breakout pullbacks)
  - Trend Continuation (pullback to fib zones)
  - Range Breakout (consolidation plays)

### 2. Risk Calculations
- **Status:** CORRECT
- Risk % = |Entry - SL| / Entry × 100
- R:R calculated using first target
- Thresholds: <2.5% LOW, 2.5-5% MEDIUM, >5% HIGH
- All setups validated to have R:R > 1.5

### 3. Confidence Scoring
- **Status:** CORRECT
- Base: 50 points
- +10 per confluence factor (max 40)
- +10 for trend alignment
- +5 for R:R ≥ 2, +5 for R:R ≥ 3
- Clamped 50-95 (realistic uncertainty)

### 4. Tier-Based Access Control
- **Status:** COMPREHENSIVE
- Feature matrix properly defined:
  - BASIC: limited signals, basic charts
  - PRO: unlimited signals, alpha picks (limited), all strategies
  - LIFETIME: unlimited everything + exclusive features
- Middleware enforces tier requirements
- Usage limits tracked in database

### 5. Frontend UI Structure
- **Status:** ALIGNED
- TradeSetups.tsx matches backend interface
- SignalCard, SetupCard display correct data
- Access control hooks implemented
- Filtering and sorting functional

### 6. Binance Integration (Market Data)
- **Status:** FUNCTIONAL
- OHLCV candle fetching works
- Price updates properly handled
- Fallback to mock data on failure
- Used by signalEngine for technical analysis

---

## ⚠️ ISSUES FOUND

### 🔴 CRITICAL ISSUES

#### 1. Alpha Picks - HARDCODED DATA (MAJOR)
**Location:** `backend/src/services/alphaPicksService.ts:25-71`

**Problem:**
- Alpha Picks use hardcoded sample data with fake entry zones, targets, and research
- Not connected to Trade Setup Engine
- No filtering logic based on setup quality
- Violates "NO fake data" rule

**Impact:**
- Users see fabricated research reports
- No correlation with actual market conditions
- Completely disconnected from the trading system

**Required Fix:**
- Alpha Picks should filter from Trade Setups
- Only setups with confidence ≥ 80, R:R ≥ 2.5, and multiple confluence factors
- Generate research narrative dynamically from setup analysis

#### 2. Setups NOT Persisted to Database
**Location:** `backend/src/routes/setups.ts`

**Problem:**
- Setups are generated on-demand and cached in memory only
- No Prisma model for TradeSetup
- Setups lost on server restart
- Cannot track setup performance over time

**Impact:**
- No historical data
- Cannot analyze setup success rates
- SignalHistory model exists but SetupHistory doesn't

**Required Fix:**
- Create Setup model in Prisma schema
- Persist generated setups to database
- Track performance metrics

#### 3. Duplicate Setup Risk
**Location:** `backend/src/services/tradeSetupEngine.ts:724-737`

**Problem:**
- Uses `Math.random()` for shuffling and range breakout direction
- No deduplication by symbol+strategy
- Range breakout randomly picks direction (line 627)

**Impact:**
- Non-deterministic results
- Could generate conflicting setups for same symbol

**Required Fix:**
- Use deterministic selection based on market conditions
- Track generated symbols to prevent duplicates

### 🟡 MEDIUM ISSUES

#### 4. Signal Engine vs Trade Setup Engine - Code Duplication
**Location:** `backend/src/services/signalEngine.ts` vs `tradeSetupEngine.ts`

**Problem:**
- Two separate engines with overlapping functionality
- SignalEngine scans 100+ coins using Binance
- TradeSetupEngine uses CoinGecko for 50 coins
- Different data sources, similar analysis

**Impact:**
- Maintenance overhead
- Potential inconsistencies
- Double API resource usage

**Recommendation:**
- Consolidate or clearly separate concerns
- Signals = short-term (5m-1h), Setups = swing (1H-1D)

#### 5. Range Breakout Strategy Uses Random Direction
**Location:** `backend/src/services/tradeSetupEngine.ts:627`

**Problem:**
```typescript
const isBullish = Math.random() > 0.5;
```
- Direction should be based on order flow, volume profile, or market structure

**Impact:**
- Random setups = invalid trading logic
- Users could get opposite directions for same setup

**Required Fix:**
- Analyze volume distribution
- Check order book imbalance
- Use higher timeframe trend direction

### 🟢 MINOR ISSUES

#### 6. Missing Error Handling in Price Fetching
**Location:** `backend/src/routes/setups.ts:97-99`

**Problem:**
- Current prices update failures silently handled
- No fallback status update logic

#### 7. Strategy Labels Don't Impact UI Display
**Problem:**
- Strategy badges shown but don't highlight setup differences
- Users can't filter by strategy confluence

---

## 🔧 FIXES TO APPLY

### Priority 1: Fix Alpha Picks (CRITICAL)

**Action:** Rewrite alphaPicksService to filter from setups

```typescript
// New logic:
// 1. Get all active setups from tradeSetupEngine
// 2. Filter: confidence >= 80, riskReward >= 2.5, confluence.length >= 3
// 3. Generate research narrative from setup.analysis
// 4. Create AlphaPick record with reference to setupId
```

### Priority 2: Add Setup Persistence

**Action:** Add to Prisma schema:

```prisma
model TradeSetup {
  id              String   @id @default(uuid())
  symbol          String
  bias            String
  status          String
  timeframe       String
  strategy        String[]
  entryZoneLow    Float
  entryZoneHigh   Float
  stopLoss        Float
  targets         Float[]
  riskReward      Float
  riskPercent     Float
  confidence      Int
  confluence      String[]
  analysis        Json
  createdAt       DateTime @default(now())
  expiresAt       DateTime
  triggeredAt     DateTime?
  invalidatedAt   DateTime?
  performance     Json?    // Track outcome
}
```

### Priority 3: Fix Range Breakout Direction

**Location:** `backend/src/services/tradeSetupEngine.ts:619-628`

Replace random with volume-based logic:
```typescript
// Check if volume is building toward breakout
const volumeIncreasing = coin.volume24h > (coin.volumeAvg || 0);
const isBullish = volumeIncreasing && coin.pricePosition > 50;
```

### Priority 4: Prevent Duplicate Setups

**Location:** `backend/src/services/tradeSetupEngine.ts:706-741`

Add tracking:
```typescript
const generatedSymbols = new Set<string>();
// ...
if (setup && !generatedSymbols.has(coin.symbol)) {
  setups.push(setup);
  generatedSymbols.add(coin.symbol);
}
```

---

## 📊 DATA FLOW VALIDATION

### Current Flow:
```
CoinGecko API → TradeSetupEngine.generateSetups() → In-Memory Cache → Frontend
                ↓
Binance API → SignalEngine → Prisma DB → Frontend (Signals page)
                ↓
Hardcoded Data → AlphaPicksService → Prisma DB → Frontend (Alpha Picks page)
```

### Issues:
1. **Disconnected:** Alpha Picks not from Setups
2. **Ephemeral:** Setups not persisted
3. **Parallel:** Two data pipelines (CoinGecko + Binance)

### Recommended Flow:
```
Binance API → SignalEngine → Prisma DB (signals)
                    ↓
            TradeSetupEngine
                    ↓
            Prisma DB (setups)
                    ↓
            AlphaPicksService (filters high-quality setups)
                    ↓
            Prisma DB (alpha picks)
```

---

## 🎯 FINAL ASSESSMENT

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Trade Setup Engine | ✅ Functional | Add persistence |
| Strategy Logic | ⚠️ Partial | Fix random direction |
| Signals System | ✅ Functional | None |
| Alpha Picks | ❌ Broken | Complete rewrite |
| Binance Integration | ✅ Functional | None |
| Tier Access Control | ✅ Comprehensive | None |
| Data Integrity | ⚠️ Partial | Connect Alpha Picks |
| Production Ready | ❌ No | Fix critical issues |

---

## 🚨 NEXT STEPS

1. **Immediately:** Fix Alpha Picks to filter from setups
2. **Today:** Add Setup persistence model
3. **This Week:** Consolidate data pipelines
4. **Before Launch:** Remove all random() from trading logic

**Estimated Effort:** 2-3 days for critical fixes

---

*Report generated by System Audit - Neon Alpha Trading Terminal*
