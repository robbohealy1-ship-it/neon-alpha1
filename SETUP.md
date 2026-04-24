# 🚀 NEON ALPHA TERMINAL - Setup Guide

Follow these steps exactly to get the application running.

## Step 1: Install PostgreSQL (if not already installed)

Download and install PostgreSQL from: https://www.postgresql.org/download/windows/

During installation:
- Remember your postgres password
- Default port: 5432

## Step 2: Create Database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE neon_alpha_terminal;
```

## Step 3: Backend Setup

### 3.1 Navigate to backend folder
```bash
cd backend
```

### 3.2 Install dependencies
```bash
npm install
```

### 3.3 Create .env file
Create a file named `.env` in the `backend` folder with this content:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/neon_alpha_terminal?schema=public"
JWT_SECRET="neon-alpha-secret-key-change-in-production-2024"
PORT=5000
NODE_ENV=development
COINGECKO_API_KEY=""
```

**Replace `YOUR_PASSWORD` with your actual PostgreSQL password!**

### 3.4 Generate Prisma Client
```bash
npm run prisma:generate
```

### 3.5 Run Database Migrations
```bash
npm run prisma:migrate
```

When prompted for migration name, type: `init`

### 3.6 Start Backend Server
```bash
npm run dev
```

✅ Backend should now be running on **http://localhost:5001**

---

## Step 4: Frontend Setup

### 4.1 Open NEW terminal and navigate to frontend
```bash
cd frontend
```

### 4.2 Install dependencies
```bash
npm install
```

### 4.3 Start Frontend Server
```bash
npm run dev
```

✅ Frontend should now be running on **http://localhost:3000**

---

## Step 5: Access the Application

1. Open your browser to: **http://localhost:3000**
2. Click **"Sign up"** to create an account
3. Fill in your details and create an account
4. You'll be automatically logged in to the dashboard

---

## 🎯 Quick Command Reference

### Backend (Terminal 1)
```bash
cd backend
npm install                    # First time only
npm run prisma:generate       # First time only
npm run prisma:migrate        # First time only
npm run dev                   # Every time
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install                   # First time only
npm run dev                   # Every time
```

---

## 🔧 Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify password in `.env` file
- Ensure database `neon_alpha_terminal` exists

### "Port 5000 already in use"
- Change `PORT=5001` in backend `.env` file
- Update frontend `vite.config.ts` proxy target to `http://localhost:5001`

### "Module not found" errors
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

### Prisma errors
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

---

## 📱 Using the Application

### Dashboard
- View real-time market data
- See market sentiment and trending coins

### Trade Setups
- Click "Generate Setup" to create AI trade opportunities
- Each setup shows confidence score, entry zone, and reasoning

### Journal
- Click "New Trade" to log a trade
- Fill in entry, exit, size, and notes
- Track your P&L automatically

### Watchlist
- Click "Add Asset" to add coins to watch
- Update sentiment (bullish/neutral/bearish)
- See live price updates

### Analytics
- View your trading performance
- Win rate, R:R ratio, and P&L charts
- Performance breakdown

---

## 🎨 Features Matching Your Design

✅ Dark theme with neon accents (cyan, purple, green)
✅ Glassmorphism cards
✅ Market overview with live data
✅ Trade setups with confidence scores
✅ Trading journal with P&L tracking
✅ Watchlist with sentiment tags
✅ Alerts feed
✅ Performance analytics with charts

---

## 🔐 Test Account

After signup, you can:
- Generate trade setups
- Add trades to journal
- Create watchlist items
- View analytics

All data is stored in your local PostgreSQL database.

---

## 🚨 Important Notes

1. **Keep both terminals running** - Backend AND Frontend
2. **Backend must start first** before frontend
3. **Database must be running** (PostgreSQL service)
4. **Don't commit .env file** to git (already in .gitignore)

---

## 📞 Need Help?

Check the main README.md for:
- API documentation
- Database schema
- Architecture details
- Future enhancements
