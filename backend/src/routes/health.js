import express from 'express';
import { isPostgresAvailable, pool, memoryStore } from '../lib/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  let latencyMs = null;

  if (isPostgresAvailable) {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      latencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error: ' + e.message;
    }
  }

  res.json({
    status: 'ok',
    service: 'ThreadPoint PERN Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'PostgreSQL',
      status: dbStatus,
      latency: latencyMs !== null ? `${latencyMs}ms` : 'N/A (in fallback mode)',
      mode: isPostgresAvailable ? 'PostgreSQL Active (Prisma + Raw SQL Triggers)' : 'Memory Store Active (Awaiting Postgres Connection String)',
    },
    metrics: {
      users_count: isPostgresAvailable ? 'Query on demand' : memoryStore.users.length,
      questions_count: isPostgresAvailable ? 'Query on demand' : memoryStore.questions.length,
      answers_count: isPostgresAvailable ? 'Query on demand' : memoryStore.answers.length,
    },
  });
});

export default router;
