import express from 'express';
import { prisma, pool, isPostgresAvailable, memoryStore } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tags
router.get('/', async (req, res) => {
  try {
    if (isPostgresAvailable) {
      const result = await pool.query(`
        SELECT
          t.id,
          t.name,
          t.description,
          COUNT(qt.question_id)::int AS question_count
        FROM "Tag" t
        LEFT JOIN "QuestionTag" qt ON qt.tag_id = t.id
        GROUP BY t.id, t.name, t.description
        ORDER BY question_count DESC, t.name ASC
      `);
      return res.json({ tags: result.rows });
    }

    // Memory fallback
    const tagsWithCounts = memoryStore.tags.map(t => {
      const count = memoryStore.questions.filter(q =>
        q.tags && q.tags.map(x => x.toLowerCase()).includes(t.name.toLowerCase())
      ).length;
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        question_count: count,
      };
    }).sort((a, b) => b.question_count - a.question_count);

    res.json({ tags: tagsWithCounts });
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ error: 'Failed to retrieve tags' });
  }
});

// GET /api/tags/watched - List tags watched by current user
router.get('/watched', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isPostgresAvailable) {
      const result = await pool.query(`
        SELECT t.id, t.name, t.description, utf.created_at AS watched_at
        FROM "UserTagFollow" utf
        JOIN "Tag" t ON utf.tag_id = t.id
        WHERE utf.user_id = $1
        ORDER BY t.name ASC
      `, [userId]);
      return res.json({ watched_tags: result.rows });
    }

    // Memory fallback
    const tagIds = (memoryStore.tagFollows || [])
      .filter(tf => tf.user_id === userId)
      .map(tf => tf.tag_id);
    const watched = memoryStore.tags.filter(t => tagIds.includes(t.id));
    res.json({ watched_tags: watched });
  } catch (err) {
    console.error('Get watched tags error:', err);
    res.status(500).json({ error: 'Failed to retrieve watched tags' });
  }
});

// POST /api/tags/:name/watch - Toggle watch status for a tag
router.post('/:name/watch', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const tagName = req.params.name.trim().toLowerCase();

    if (isPostgresAvailable) {
      const tagRes = await pool.query('SELECT id, name FROM "Tag" WHERE LOWER(name) = $1', [tagName]);
      if (tagRes.rows.length === 0) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      const tagId = tagRes.rows[0].id;

      const check = await pool.query(
        'SELECT id FROM "UserTagFollow" WHERE user_id = $1 AND tag_id = $2',
        [userId, tagId]
      );

      if (check.rows.length > 0) {
        // Unwatch
        await pool.query('DELETE FROM "UserTagFollow" WHERE user_id = $1 AND tag_id = $2', [userId, tagId]);
        return res.json({ watched: false, tag_name: tagName, message: `Unwatched ${tagName}` });
      } else {
        // Watch
        await pool.query(
          'INSERT INTO "UserTagFollow" (user_id, tag_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
          [userId, tagId]
        );
        return res.json({ watched: true, tag_name: tagName, message: `Now watching ${tagName}` });
      }
    }

    // Memory fallback
    const tag = memoryStore.tags.find(t => t.name.toLowerCase() === tagName);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (!memoryStore.tagFollows) memoryStore.tagFollows = [];
    const idx = memoryStore.tagFollows.findIndex(tf => tf.user_id === userId && tf.tag_id === tag.id);

    if (idx !== -1) {
      memoryStore.tagFollows.splice(idx, 1);
      return res.json({ watched: false, tag_name: tagName, message: `Unwatched ${tagName}` });
    } else {
      memoryStore.tagFollows.push({
        id: Date.now(),
        user_id: userId,
        tag_id: tag.id,
        created_at: new Date(),
      });
      return res.json({ watched: true, tag_name: tagName, message: `Now watching ${tagName}` });
    }
  } catch (err) {
    console.error('Toggle tag watch error:', err);
    res.status(500).json({ error: 'Failed to toggle tag watch' });
  }
});

// GET /api/tags/:name
router.get('/:name', async (req, res) => {
  try {
    const tagName = req.params.name.toLowerCase();

    if (isPostgresAvailable) {
      const tRes = await pool.query('SELECT * FROM "Tag" WHERE LOWER(name) = $1', [tagName]);
      if (tRes.rows.length === 0) return res.status(404).json({ error: 'Tag not found' });

      const tagRow = tRes.rows[0];
      const qRes = await pool.query(`
        SELECT
          q.id, q.title, q.body, q.user_id AS author_id, COALESCE(q.views, 0) AS view_count, q.created_at,
          u.username AS author_username, u.reputation_score AS author_reputation, u.avatar_url AS author_avatar,
          COALESCE(v.net_votes, 0) AS net_votes,
          COALESCE(a.answer_count, 0) AS answer_count,
          COALESCE(a.has_accepted, false) AS has_accepted,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT all_t.name), NULL) AS tags
        FROM "Question" q
        JOIN "QuestionTag" qt ON qt.question_id = q.id
        JOIN "User" u ON q.user_id = u.id
        LEFT JOIN "QuestionTag" all_qt ON all_qt.question_id = q.id
        LEFT JOIN "Tag" all_t ON all_qt.tag_id = all_t.id
        LEFT JOIN (
          SELECT target_id, SUM(value) AS net_votes FROM "Vote" WHERE target_type = 'question' GROUP BY target_id
        ) v ON v.target_id = q.id
        LEFT JOIN (
          SELECT question_id, COUNT(*) AS answer_count, BOOL_OR(is_accepted) AS has_accepted FROM "Answer" GROUP BY question_id
        ) a ON a.question_id = q.id
        WHERE qt.tag_id = $1
        GROUP BY q.id, q.title, q.body, q.user_id, q.views, q.created_at,
                 u.username, u.reputation_score, u.avatar_url, v.net_votes, a.answer_count, a.has_accepted
        ORDER BY q.created_at DESC
      `, [tagRow.id]);

      return res.json({ tag: tagRow, questions: qRes.rows });
    }

    // Memory fallback
    const tag = memoryStore.tags.find(t => t.name.toLowerCase() === tagName);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const questions = memoryStore.questions
      .filter(q => q.tags && q.tags.map(x => x.toLowerCase()).includes(tagName))
      .map(q => {
        const author = memoryStore.users.find(u => u.id === (q.user_id || q.author_id));
        const qVotes = memoryStore.votes.filter(v => v.target_type === 'question' && v.target_id === q.id);
        const answers = memoryStore.answers.filter(a => a.question_id === q.id);
        return {
          id: q.id,
          title: q.title,
          body: q.body,
          views: q.views || q.view_count || 0,
          view_count: q.views || q.view_count || 0,
          author_username: author ? author.username : 'anonymous',
          author_reputation: author ? author.reputation_score : 1,
          net_votes: qVotes.reduce((sum, v) => sum + v.value, 0),
          answer_count: answers.length,
          has_accepted: answers.some(a => a.is_accepted),
          created_at: q.created_at,
        };
      });

    res.json({ tag, questions });
  } catch (err) {
    console.error('Get tag details error:', err);
    res.status(500).json({ error: 'Failed to retrieve tag details' });
  }
});

export default router;
