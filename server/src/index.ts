import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRoutes      from './routes/auth';
import equipmentRoutes from './routes/equipment';
import rentalRoutes    from './routes/rentals';
import { errorHandler } from './middleware/errorHandler';

// ── Startup assertions — fail fast if required env vars are missing ────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: required environment variable ${key} is not set. Exiting.`);
    process.exit(1);
  }
}

const app  = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allowed origins: comma-separated list in CORS_ORIGIN env var, or the Vite
// dev server defaults (5173 and 5174 cover the two ports Vite cycles through).
const rawOrigins = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173,http://localhost:5174';
const allowedOrigins = new Set(rawOrigins.split(',').map(o => o.trim()).filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header) and listed origins
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed.`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/rentals',   rentalRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Mender Rentals API running on http://localhost:${PORT}`);
});

export default app;
