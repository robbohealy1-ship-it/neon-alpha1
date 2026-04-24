# 🧩 NEON ALPHA TERMINAL

A production-grade crypto trading intelligence platform combining real-time market data, AI-driven trade setup scoring, and comprehensive trading analytics.

## 🎯 Features

- **Real-time Market Dashboard** - Live crypto prices and market sentiment
- **AI Trade Setup Engine** - Intelligent trade opportunity detection with confidence scoring
- **Trading Journal** - Complete trade logging with P&L tracking
- **Performance Analytics** - Win rate, R:R ratio, and performance charts
- **Watchlist System** - Track favorite assets with sentiment tags
- **Live Alerts** - Real-time notifications for market events
- **User Authentication** - Secure JWT-based auth system
- **Subscription Tiers** - Free and Pro tier structure

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS (Neon/Dark theme)
- Framer Motion (Animations)
- Zustand (State management)
- Recharts (Data visualization)
- React Router (Navigation)

### Backend
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- WebSocket support
- RESTful API

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/neon_alpha_terminal"
JWT_SECRET="your-secret-key-here"
PORT=5000
```

5. Run Prisma migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

6. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🚀 Usage

1. **Sign Up**: Create a new account at `/signup`
2. **Dashboard**: View real-time market overview
3. **Trade Setups**: Generate AI-powered trade opportunities
4. **Journal**: Log your trades and track performance
5. **Watchlist**: Add assets to monitor
6. **Analytics**: View detailed performance metrics

## 📊 Database Schema

### Core Models
- **User** - Authentication and profile data
- **Trade** - Trading journal entries
- **WatchlistItem** - User's tracked assets
- **Alert** - System notifications
- **TradeSetup** - AI-generated trade opportunities
- **SubscriptionPlan** - Tier management

## 🎨 Design Philosophy

- **Dark Mode Only** - Black/navy base with neon accents (cyan, purple, green)
- **Glassmorphism** - Translucent cards with blur effects
- **Smooth Animations** - Framer Motion for fluid transitions
- **Terminal Aesthetic** - Professional trading terminal feel
- **Responsive** - Desktop-first, mobile-supported

## 🔐 Authentication

JWT-based authentication with:
- Secure password hashing (bcrypt)
- Token-based sessions
- Protected API routes
- Automatic token refresh

## 📡 API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Trades
- `GET /api/trades` - Get user trades
- `POST /api/trades` - Create trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade

### Watchlist
- `GET /api/watchlist` - Get watchlist
- `POST /api/watchlist` - Add item
- `PUT /api/watchlist/:id` - Update item
- `DELETE /api/watchlist/:id` - Remove item

### Setups
- `GET /api/setups` - Get active setups
- `POST /api/setups/generate` - Generate new setup

### Market
- `GET /api/market/overview` - Market data
- `GET /api/market/sentiment` - Market sentiment

### Analytics
- `GET /api/analytics/performance` - Trading performance

## 🔧 Development

### Backend Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
```

### Frontend Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🌟 Future Enhancements

- [ ] Real CoinGecko API integration
- [ ] WebSocket live price updates
- [ ] Advanced charting (TradingView)
- [ ] Social trading features
- [ ] Mobile app (React Native)
- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] Multi-exchange support

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing

This is a demo/template project. Feel free to fork and customize for your needs.

---

**Built with ❤️ for serious crypto traders**
