import express from 'express';
import { pool, isPostgresAvailable, memoryStore } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookmarks - Get all bookmarked questions for current authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isPostgresAvailable) {
      const query = `
        SELECT 
          q.id,
          q.title,
          q.body,
          q.user_id,
          q.views AS view_count,
          q.created_at,
          q.updated_at,
          u.username AS author_username,
          u.avatar_url AS author_avatar,
          u.reputation_score AS author_reputation,
          COALESCE(v.net_votes, 0) AS net_votes,
          COALESCE(ans.answer_count, 0) AS answer_count,
          COALESCE(ans.has_accepted, false) AS has_accepted,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.name), NULL) AS tags,
          b.created_at AS bookmarked_at
        FROM "Bookmark" b
        JOIN "Question" q ON b.question_id = q.id
        JOIN "User" u ON q.user_id = u.id
        LEFT JOIN (
          SELECT target_id, SUM(value) AS net_votes 
          FROM "Vote" 
          WHERE target_type = 'question' 
          GROUP BY target_id
        ) v ON q.id = v.target_id
        LEFT JOIN (
          SELECT 
            question_id, 
            COUNT(id) AS answer_count,
            BOOL_OR(is_accepted) AS has_accepted
          FROM "Answer"
          GROUP BY question_id
        ) ans ON q.id = ans.question_id
        LEFT JOIN "QuestionTag" qt ON q.id = qt.question_id
        LEFT JOIN "Tag" t ON qt.tag_id = t.id
        WHERE b.user_id = $1
        GROUP BY q.id, u.id, v.net_votes, ans.answer_count, ans.has_accepted, b.created_at
        ORDER BY b.created_at DESC;
      `;
      const result = await pool.query(query, [userId]);
      return res.json({ bookmarks: result.rows });
    }

    // Memory store fallback
    const userBookmarks = (memoryStore.bookmarks || []).filter(b => b.user_id === userId);
    const questions = userBookmarks.map(b => {
      const q = memoryStore.questions.find(item => item.id === b.question_id);
      if (!q) return null;
      const author = memoryStore.users.find(u => u.id === (q.author_id || q.user_id)) || {};
      const qVotes = memoryStore.votes.filter(v => v.target_type === 'question' && v.target_id === q.id);
      const net_votes = qVotes.reduce((acc, curr) => acc + curr.value, 0);
      const answers = memoryStore.answers.filter(a => a.question_id === q.id);

      return {
        ...q,
        author_username: author.username,
        author_avatar: author.avatar_url,
        author_reputation: author.reputation_score,
        net_votes,
        answer_count: answers.length,
        has_accepted: answers.some(a => a.is_accepted),
        bookmarked_at: b.created_at,
      };
    }).filter(Boolean);

    res.json({ bookmarks: questions });
  } catch (err) {
    console.error('Fetch bookmarks error:', err);
    res.status(500).json({ error: 'Failed to retrieve bookmarks' });
  }
});

// GET /api/bookmarks/ids - Get array of bookmarked question IDs for fast UI lookup
router.get('/ids', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    if (isPostgresAvailable) {
      const result = await pool.query('SELECT question_id FROM "Bookmark" WHERE user_id = $1', [userId]);
      const ids = result.rows.map(r => r.question_id);
      return res.json({ ids });
    }

    const ids = (memoryStore.bookmarks || []).filter(b => b.user_id === userId).map(b => b.question_id);
    res.json({ ids });
  } catch (err) {
    console.error('Fetch bookmark ids error:', err);
    res.status(500).json({ error: 'Failed to retrieve bookmark ids' });
  }
});

// POST /api/bookmarks/:questionId - Toggle bookmark state
router.post('/:questionId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const questionId = parseInt(req.params.questionId, 10);

    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    if (isPostgresAvailable) {
      const check = await pool.query(
        'SELECT id FROM "Bookmark" WHERE user_id = $1 AND question_id = $2',
        [userId, questionId]
      );

      if (check.rows.length > 0) {
        await pool.query(
          'DELETE FROM "Bookmark" WHERE user_id = $1 AND question_id = $2',
          [userId, questionId]
        );
        return res.json({ bookmarked: false, question_id: questionId, message: 'Bookmark removed' });
      } else {
        await pool.query(
          'INSERT INTO "Bookmark" (user_id, question_id, created_at) VALUES ($1, $2, NOW())',
          [userId, questionId]
        );
        return res.json({ bookmarked: true, question_id: questionId, message: 'Bookmark added' });
      }
    }

    if (!memoryStore.bookmarks) {
      memoryStore.bookmarks = [];
    }
    const idx = memoryStore.bookmarks.findIndex(b => b.user_id === userId && b.question_id === questionId);
    if (idx !== -1) {
      memoryStore.bookmarks.splice(idx, 1);
      return res.json({ bookmarked: false, question_id: questionId, message: 'Bookmark removed' });
    } else {
      memoryStore.bookmarks.push({
        id: Date.now(),
        user_id: userId,
        question_id: questionId,
        created_at: new Date(),
      });
      return res.json({ bookmarked: true, question_id: questionId, message: 'Bookmark added' });
    }
  } catch (err) {
    console.error('Toggle bookmark error:', err);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

export default router;
