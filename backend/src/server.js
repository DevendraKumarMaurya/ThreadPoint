import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testDbConnection } from './lib/db.js';

import authRoutes from './routes/auth.js';
import questionsRoutes from './routes/questions.js';
import answersRoutes from './routes/answers.js';
import votesRoutes from './routes/votes.js';
import commentsRoutes from './routes/comments.js';
import tagsRoutes from './routes/tags.js';
import searchRoutes from './routes/search.js';
import usersRoutes from './routes/users.js';
import bookmarksRoutes from './routes/bookmarks.js';
import healthRoutes from './routes/health.js';
import notificationsRoutes from './routes/notifications.js';
import badgesRoutes from './routes/badges.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api', answersRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/health', healthRoutes);

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

// Serve static frontend bundle in production if built
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // SPA fallback: serve index.html for all non-API routes
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Development root API info
  app.get('/', (req, res) => {
    res.json({
      name: 'ThreadPoint API',
      tagline: 'Ask. Answer. Get recognized.',
      status: 'online',
      version: '1.0.0',
      documentation: '/api/health',
    });
  });
}

// 404 Handler for API endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Boot Server
async function startServer() {
  await testDbConnection();

  app.listen(PORT, () => {
    console.log(`ThreadPoint backend running on http://localhost:${PORT}`);
    console.log(`Health and Status: http://localhost:${PORT}/api/health`);
  });
}

startServer();

export default app;
