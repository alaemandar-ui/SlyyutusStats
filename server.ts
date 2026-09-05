import './server/env.js';
import express from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { apiRouter, handleKickLogin, handleKickOAuthCallback } from './server/routes.js';
import { authMiddleware } from './server/auth.js';
import { trackerService } from './server/trackerService.js';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(authMiddleware);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SLYYUTUS.STATS',
      version: '1.0.0',
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

  // Start background tracking services
  trackerService.start();

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SLYYUTUS.STATS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SLYYUTUS.STATS] Fatal server error:', err);
  process.exit(1);
});
