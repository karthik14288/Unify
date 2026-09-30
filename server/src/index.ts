import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRouter from './routes/api.routes.js';

const app = express();

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development origins or no-origin (mobile, curl)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Unhandled Express Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred',
  });
});

// Start Express Server
const server = app.listen(env.PORT, () => {
  console.log(`
  ======================================================
  🚀 UNIFY — Cross-Modal AI Understanding Platform Backend
  📡 Server listening on: http://localhost:${env.PORT}
  🔗 Supabase Project: ${env.SUPABASE_URL}
  ✨ Gemini 2.5 Pro & text-embedding-004 Engine Armed
  ======================================================
  `);
});

export default app;
