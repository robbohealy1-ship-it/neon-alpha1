import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth';
import tradeRoutes from './routes/trades';
import watchlistRoutes from './routes/watchlist';
import alertRoutes from './routes/alerts';
import setupRoutes from './routes/setups';
import marketRoutes from './routes/market';
import analyticsRoutes from './routes/analytics';
import signalsRoutes, { startSignalScanner } from './routes/signals';
import telegramRoutes from './routes/telegram';
import subscriptionRoutes from './routes/subscription';
import signalPerformanceRoutes from './routes/signalPerformance';
import signalLimitRoutes from './routes/signalLimit';
import alphaPicksRoutes from './routes/alphaPicks';
import userRoutes from './routes/user';
import { startSignalChecker } from './services/signalTrackerService';
import { alphaPicksService } from './services/alphaPicksService';
import { schedulerService } from './services/schedulerService';
import { setupSchedulerService } from './services/setupSchedulerService';
import { lowCapGemScanner } from './services/lowCapGemScanner';

dotenv.config();

const app = express();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json({
  verify: (req: any, res, buf) => {
    // Store raw body for Stripe webhook verification
    if (req.url === '/api/subscription/webhook') {
      req.rawBody = buf;
    }
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/setups', setupRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/signals', signalsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/signal-performance', signalPerformanceRoutes);
app.use('/api/signal-limit', signalLimitRoutes);
app.use('/api/alpha-picks', alphaPicksRoutes);
app.use('/api/user', userRoutes);

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'price_update',
        data: {
          BTC: 45000 + Math.random() * 1000,
          ETH: 2500 + Math.random() * 100,
          timestamp: Date.now()
        }
      }));
    }
  }, 3000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket client disconnected');
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready`);
  
  // Signal scanner disabled to avoid rate limits - signals generated from setups instead
  // startSignalScanner();
  
  // Enable signal checker to track TP/SL hits (runs every 5 minutes)
  setInterval(() => {
    startSignalChecker();
  }, 5 * 60 * 1000);
  console.log('[Server] Signal tracker enabled (checks every 5 min)');
  
  // Start Low-Cap Gem Scanner (runs daily, hunts for community hyped gems)
  lowCapGemScanner.startDailyScan();
  
  // Legacy: Initialize Alpha Picks sample data if empty (for fallback)
  alphaPicksService.initializeSampleData().catch(console.error);
  
  // Legacy: Keep 5-day scheduler for backwards compatibility
  schedulerService.start().catch(console.error);
  
  // Start trade setup scheduler (runs every 4 hours, generates fresh setups)
  setupSchedulerService.start().catch(console.error);
});
