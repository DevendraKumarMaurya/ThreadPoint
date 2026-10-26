import express from 'express';
import { prisma, pool, isPostgresAvailable, memoryStore, syncMemoryUserReputation } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateVote } from '../middleware/validate.js';

const router = express.Router();

// POST /api/votes
// Casts, updates, or removes a vote. Enforces one vote per user per target.
// Triggers automatic reputation recalculation at the database layer.
router.post('/', requireAuth, validateVote, async (req, res) => {
  try {
    const { target_type, target_id, value } = req.body;
    const user_id = req.user.id;
    const targetId = parseInt(target_id, 10);
    const voteValue = parseInt(value, 10);

    if (isPostgresAvailable) {
      if (voteValue === 0) {
        // Remove vote
        await pool.query(
          'DELETE FROM "Vote" WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
          [user_id, target_type, targetId]
        );
      } else {
        // Upsert vote (update on conflict)
        await pool.query(
          `INSERT INTO "Vote" (user_id, target_type, target_id, value, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id, target_type, target_id)
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [user_id, target_type, targetId, voteValue]
        );
      }

      // Query current net votes
      const netRes = await pool.query(
        'SELECT COALESCE(SUM(value), 0) AS net_votes FROM "Vote" WHERE target_type = $1 AND target_id = $2',
        [target_type, targetId]
      );
      const net_votes = parseInt(netRes.rows[0].net_votes, 10);

      // Query target author's updated reputation score (computed by trigger)
      let authorId = null;
      let authorRep = null;
      if (target_type === 'question') {
        const aRes = await pool.query(
          'SELECT u.id AS author_id, u.reputation_score FROM "Question" q JOIN "User" u ON q.user_id = u.id WHERE q.id = $1',
          [targetId]
        );
        if (aRes.rows.length > 0) {
          authorId = aRes.rows[0].author_id;
          authorRep = aRes.rows[0].reputation_score;
        }
      } else {
        const aRes = await pool.query(
          'SELECT u.id AS author_id, u.reputation_score FROM "Answer" a JOIN "User" u ON a.user_id = u.id WHERE a.id = $1',
          [targetId]
        );
        if (aRes.rows.length > 0) {
          authorId = aRes.rows[0].author_id;
          authorRep = aRes.rows[0].reputation_score;
        }
      }

      return res.json({
        message: 'Vote processed successfully',
        net_votes,
        current_user_vote: voteValue,
        target_author_id: authorId,
        target_author_reputation: authorRep,
      });
    }

    // Memory fallback
    const existingIndex = memoryStore.votes.findIndex(
      v => v.user_id === user_id && v.target_type === target_type && v.target_id === targetId
    );

    let authorIdToSync = null;
    if (target_type === 'question') {
      const q = memoryStore.questions.find(x => x.id === targetId);
      if (q) authorIdToSync = q.user_id || q.author_id;
    } else {
      const a = memoryStore.answers.find(x => x.id === targetId);
      if (a) authorIdToSync = a.user_id || a.author_id;
    }

    if (voteValue === 0) {
      if (existingIndex !== -1) {
        memoryStore.votes.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex !== -1) {
        memoryStore.votes[existingIndex].value = voteValue;
      } else {
        const newId = memoryStore.votes.length > 0 ? Math.max(...memoryStore.votes.map(v => v.id)) + 1 : 1;
        memoryStore.votes.push({
          id: newId,
          user_id,
          target_type,
          target_id: targetId,
          value: voteValue,
        });
      }
    }

    if (authorIdToSync) {
      syncMemoryUserReputation(authorIdToSync);
    }

    const currentVotes = memoryStore.votes.filter(
      v => v.target_type === target_type && v.target_id === targetId
    );
    const net_votes = currentVotes.reduce((sum, v) => sum + v.value, 0);

    const authorUser = authorIdToSync ? memoryStore.users.find(u => u.id === authorIdToSync) : null;

    res.json({
      message: 'Vote processed successfully',
      net_votes,
      current_user_vote: voteValue,
      target_author_id: authorIdToSync,
      target_author_reputation: authorUser ? authorUser.reputation_score : null,
    });
  } catch (err) {
    // PostgreSQL foreign key constraint violation — user ID in token no longer exists
    if (err.code === '23503' && err.constraint && err.constraint.includes('user_id')) {
      console.warn(`[Votes] FK constraint violation: user_id=${req.user?.id} not in User table. Stale JWT.`);
      return res.status(401).json({
        error: 'Session expired',
        message: 'Your session is no longer valid. Please log in again.',
        code: 'STALE_SESSION',
      });
    }
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to process vote: ' + err.message });
  }
});

// GET /api/votes/my-votes
router.get('/my-votes', requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;

    if (isPostgresAvailable) {
      const vRes = await pool.query(
        'SELECT target_type, target_id, value FROM "Vote" WHERE user_id = $1',
        [user_id]
      );
      return res.json({ votes: vRes.rows });
    }

    const userVotes = memoryStore.votes
      .filter(v => v.user_id === user_id)
      .map(v => ({ target_type: v.target_type, target_id: v.target_id, value: v.value }));

    res.json({ votes: userVotes });
  } catch (err) {
    console.error('Get my-votes error:', err);
    res.status(500).json({ error: 'Failed to get user votes' });
  }
});

export default router;
