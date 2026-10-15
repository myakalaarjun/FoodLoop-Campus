import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
const frontendDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
const hasFrontend = existsSync(frontendDist);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || (process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173'),
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

if (hasFrontend) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(resolve(frontendDist, 'index.html'), error => {
      if (error) next(error);
    });
  });
} else {
  // No built frontend on this server: always answer the root with JSON
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'FoodLoop Campus API is running'
    });
  });
}

app.use(notFound);
app.use(errorHandler);
export default app;