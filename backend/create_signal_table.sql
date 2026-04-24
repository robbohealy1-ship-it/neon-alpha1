-- Create Signal table
CREATE TABLE IF NOT EXISTS "Signal" (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    coin VARCHAR(255) NOT NULL,
    symbol VARCHAR(255) NOT NULL,
    direction VARCHAR(255) NOT NULL,
    "entryMin" DOUBLE PRECISION NOT NULL,
    "entryMax" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    target1 DOUBLE PRECISION NOT NULL,
    target2 DOUBLE PRECISION,
    target3 DOUBLE PRECISION,
    confidence INTEGER NOT NULL,
    "setupType" VARCHAR(255) NOT NULL,
    timeframe VARCHAR(255) NOT NULL,
    strategy VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'FORMING',
    ema50 DOUBLE PRECISION,
    ema200 DOUBLE PRECISION,
    rsi DOUBLE PRECISION,
    volume DOUBLE PRECISION,
    "volumeAvg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "entryPrice" DOUBLE PRECISION,
    "exitPrice" DOUBLE PRECISION,
    "pnlPercent" DOUBLE PRECISION
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Signal_status_idx" ON "Signal"(status);
CREATE INDEX IF NOT EXISTS "Signal_coin_idx" ON "Signal"(coin);
CREATE INDEX IF NOT EXISTS "Signal_createdAt_idx" ON "Signal"("createdAt");
CREATE INDEX IF NOT EXISTS "Signal_expiresAt_idx" ON "Signal"("expiresAt");
CREATE INDEX IF NOT EXISTS "Signal_setupType_idx" ON "Signal"("setupType");
