import './server/env.js';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { apiRouter, handleKickLogin, handleKickOAuthCallback } from './server/routes.js';
import { authMiddleware } from './server/auth.js';
import { trackerService } from './server/trackerService.js';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // 1. Identify AI Studio dev sandbox vs Cloud Run / production deployment
  const isAiStudioSandbox = Boolean(process.env.APPLET_ID && process.env.NODE_ENV !== 'production');
  const isProduction = !isAiStudioSandbox || process.env.NODE_ENV === 'production' || Boolean(process.argv[1] && process.argv[1].includes('dist'));

  if (isProduction && !process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  // 2. Resolve listening PORT:
  // In AI Studio sandbox development: port 3000 is required by the dev nginx reverse-proxy.
  // In Cloud Run deployment (and production containers): listen directly on process.env.PORT (Cloud Run default 8080).
  const PORT = isAiStudioSandbox 
    ? 3000 
    : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

  console.log(`[SLYYUTUS.STATS] Starting server... (isAiStudioSandbox: ${isAiStudioSandbox}, isProduction: ${isProduction}, PORT: ${PORT})`);

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(authMiddleware);

  // Health check - critical for Cloud Run container probes
  app.get(['/api/health', '/_ah/health', '/healthz', '/health'], (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'SLYYUTUS.STATS',
      version: '1.0.0',
      uptime: process.uptime(),
      port: PORT,
      production: isProduction,
      timestamp: new Date().toISOString()
    });
  });

  // Direct Kick OAuth routes
  // /auth/callback forwards query parameters (code, state, error) to /api/auth/kick/callback
  app.get('/auth/callback', (req, res) => {
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
    console.log(`[Kick OAuth] /auth/callback received. Forwarding query parameters to /api/auth/kick/callback${queryString ? ' with code/state' : ''}`);
    return res.redirect(`/api/auth/kick/callback${queryString}`);
  });
  app.get('/api/auth/kick/callback', handleKickOAuthCallback);
  app.get(['/auth/kick/login', '/auth/kick', '/login/kick', '/api/auth/kick/login', '/api/auth/kick'], handleKickLogin);

  // API routes
  app.use('/api', apiRouter);

  // Start background tracking services (non-blocking)
  try {
    trackerService.start();
  } catch (err: any) {
    console.error('[SLYYUTUS.STATS] Non-fatal background tracker init error:', err?.message || err);
  }

  // Vite middleware for development vs Static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(200).send('SLYYUTUS.STATS service is running.');
        }
      });
    } else {
      app.get('*', (req, res) => {
        res.status(200).send('SLYYUTUS.STATS service is running.');
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SLYYUTUS.STATS] Server listening on http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });

  // If running in production on a custom Cloud Run PORT (e.g. 8080), also bind port 3000 if available
  if (PORT !== 3000) {
    try {
      const secondaryServer = http.createServer(app);
      secondaryServer.on('error', (err: any) => {
        // Safe to ignore if port 3000 is occupied or not allowed
        console.log(`[SLYYUTUS.STATS] Secondary port 3000 not bound (${err.code || err.message})`);
      });
      secondaryServer.listen(3000, '0.0.0.0', () => {
        console.log(`[SLYYUTUS.STATS] Secondary listener also active on http://0.0.0.0:3000`);
      });
    } catch {
      // Ignore secondary listener errors
    }
  }
}

startServer().catch((err) => {
  console.error('[SLYYUTUS.STATS] Fatal server error:', err);
  process.exit(1);
});
