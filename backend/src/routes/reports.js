import express from 'express';
import { pool, isPostgresAvailable, memoryStore } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reports - Submit a report for question, answer, or comment
router.post('/', requireAuth, async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { target_type, target_id, reason, details = '' } = req.body;

    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: 'target_type, target_id, and reason are required' });
    }

    if (!['question', 'answer', 'comment'].includes(target_type)) {
      return res.status(400).json({ error: 'Invalid target_type. Must be question, answer, or comment' });
    }

    const targetIdNum = parseInt(target_id, 10);
    if (isNaN(targetIdNum)) {
      return res.status(400).json({ error: 'target_id must be a valid number' });
    }

    if (isPostgresAvailable) {
      const result = await pool.query(
        `INSERT INTO "Report" (reporter_id, target_type, target_id, reason, details, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
         RETURNING id, reporter_id, target_type, target_id, reason, status, created_at`,
        [reporterId, target_type, targetIdNum, String(reason).trim(), String(details).trim()]
      );

      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully. Our moderation team will review this content.',
        report: result.rows[0],
      });
    }

    // Memory fallback
    if (!memoryStore.reports) memoryStore.reports = [];
    const newId = memoryStore.reports.length > 0 ? Math.max(...memoryStore.reports.map(r => r.id)) + 1 : 1;
    const report = {
      id: newId,
      reporter_id: reporterId,
      target_type,
      target_id: targetIdNum,
      reason: String(reason).trim(),
      details: String(details).trim(),
      status: 'pending',
      created_at: new Date(),
    };
    memoryStore.reports.push(report);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our moderation team will review this content.',
      report,
    });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

export default router;
