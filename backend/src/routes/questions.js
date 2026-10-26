import express from 'express';
import { prisma, pool, isPostgresAvailable, memoryStore } from '../lib/db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validateQuestion } from '../middleware/validate.js';

const router = express.Router();

// GET /api/questions
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort = 'interesting', tag, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    if (isPostgresAvailable) {
      if (sort === 'hot') {
        let sql = `
          SELECT * FROM hot_questions
        `;
        const params = [];
        if (tag) {
          params.push(tag.toLowerCase());
          sql += ` WHERE $1 = ANY(tags)`;
        }
        sql += ` ORDER BY hot_score DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limitNum, offset);

        const result = await pool.query(sql, params);
        return res.json({
          questions: result.rows.map(r => ({
            ...r,
            author_id: r.user_id || r.author_id,
            view_count: r.views || r.view_count || 0,
          })),
          page: pageNum,
          limit: limitNum,
        });
      }

      // Standard queries with sort
      let orderBySql = 'q.created_at DESC';
      if (sort === 'votes') orderBySql = 'net_votes DESC, q.created_at DESC';
      else if (sort === 'unanswered') orderBySql = 'answer_count ASC, q.created_at DESC';

      let filterSql = '1=1';
      const params = [];
      if (tag) {
        params.push(tag.toLowerCase());
        filterSql += ` AND EXISTS (
          SELECT 1 FROM "QuestionTag" qt
          JOIN "Tag" t ON qt.tag_id = t.id
          WHERE qt.question_id = q.id AND LOWER(t.name) = $${params.length}
        )`;
      }

      if (sort === 'unanswered') {
        filterSql += ` AND (SELECT COUNT(*) FROM "Answer" a WHERE a.question_id = q.id) = 0`;
      }

      if (sort === 'watched' && req.user?.id) {
        filterSql += ` AND EXISTS (
          SELECT 1 FROM "QuestionTag" qt
          JOIN "UserTagFollow" utf ON qt.tag_id = utf.tag_id
          WHERE qt.question_id = q.id AND utf.user_id = ${parseInt(req.user.id, 10)}
        )`;
      }

      const querySql = `
        SELECT
          q.id,
          q.title,
          q.body,
          q.user_id,
          q.user_id AS author_id,
          COALESCE(q.views, 0) AS views,
          COALESCE(q.views, 0) AS view_count,
          q.created_at,
          q.updated_at,
          COALESCE(v.net_votes, 0) AS net_votes,
          COALESCE(a.answer_count, 0) AS answer_count,
          COALESCE(a.has_accepted, false) AS has_accepted,
          u.username AS author_username,
          u.reputation_score AS author_reputation,
          u.avatar_url AS author_avatar,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.name), NULL) AS tags
        FROM "Question" q
        JOIN "User" u ON q.user_id = u.id
        LEFT JOIN (
          SELECT target_id, SUM(value) AS net_votes
          FROM "Vote"
          WHERE target_type = 'question'
          GROUP BY target_id
        ) v ON v.target_id = q.id
        LEFT JOIN (
          SELECT question_id, COUNT(*) AS answer_count, BOOL_OR(is_accepted) AS has_accepted
          FROM "Answer"
          GROUP BY question_id
        ) a ON a.question_id = q.id
        LEFT JOIN "QuestionTag" qt ON qt.question_id = q.id
        LEFT JOIN "Tag" t ON qt.tag_id = t.id
        WHERE ${filterSql}
        GROUP BY q.id, q.title, q.body, q.user_id, q.views, q.created_at, q.updated_at,
                 v.net_votes, a.answer_count, a.has_accepted, u.username, u.reputation_score, u.avatar_url
        ORDER BY ${orderBySql}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      params.push(limitNum, offset);

      const result = await pool.query(querySql, params);
      return res.json({
        questions: result.rows,
        page: pageNum,
        limit: limitNum,
      });
    }

    // Fallback in-memory query
    let questions = memoryStore.questions.map(q => {
      const author = memoryStore.users.find(u => u.id === (q.user_id || q.author_id)) || {
        username: 'anonymous',
        reputation_score: 1,
        avatar_url: null,
      };
      const qVotes = memoryStore.votes.filter(v => v.target_type === 'question' && v.target_id === q.id);
      const net_votes = qVotes.reduce((sum, v) => sum + v.value, 0);
      const answers = memoryStore.answers.filter(a => a.question_id === q.id);
      const answer_count = answers.length;
      const has_accepted = answers.some(a => a.is_accepted);

      const viewsCount = q.views || q.view_count || 0;
      const hoursOld = (Date.now() - new Date(q.created_at).getTime()) / 3600000;
      const hot_score = ((net_votes * 10.0 + answer_count * 5.0 + viewsCount * 0.1 + 10.0) /
        Math.pow(hoursOld + 2.0, 1.5)).toFixed(4);

      return {
        id: q.id,
        title: q.title,
        body: q.body,
        user_id: q.user_id || q.author_id,
        author_id: q.user_id || q.author_id,
        author_username: author.username,
        author_reputation: author.reputation_score,
        author_avatar: author.avatar_url,
        views: viewsCount,
        view_count: viewsCount,
        tags: q.tags || [],
        net_votes,
        answer_count,
        has_accepted,
        hot_score: parseFloat(hot_score),
        created_at: q.created_at,
        updated_at: q.updated_at,
      };
    });

    if (tag) {
      questions = questions.filter(q => q.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));
    }

    if (sort === 'watched' && req.user?.id) {
      const watchedTagIds = (memoryStore.tagFollows || []).filter(tf => tf.user_id === req.user.id).map(tf => tf.tag_id);
      const watchedTagNames = memoryStore.tags.filter(t => watchedTagIds.includes(t.id)).map(t => t.name.toLowerCase());
      questions = questions.filter(q => (q.tags || []).some(t => watchedTagNames.includes(t.toLowerCase())));
    }

    if (sort === 'hot') {
      questions.sort((a, b) => b.hot_score - a.hot_score);
    } else if (sort === 'votes') {
      questions.sort((a, b) => b.net_votes - a.net_votes);
    } else if (sort === 'unanswered') {
      questions = questions.filter(q => q.answer_count === 0);
      questions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      questions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const paginated = questions.slice(offset, offset + limitNum);
    res.json({
      questions: paginated,
      total: questions.length,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: 'Failed to retrieve questions' });
  }
});

// GET /api/questions/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    if (isPostgresAvailable) {
      // Increment view count
      await pool.query('UPDATE "Question" SET views = views + 1 WHERE id = $1', [questionId]);

      // Fetch question
      const qRes = await pool.query(
        `SELECT
          q.id, q.title, q.body, q.user_id, q.user_id AS author_id,
          COALESCE(q.views, 0) AS views, COALESCE(q.views, 0) AS view_count,
          q.created_at, q.updated_at,
          u.username AS author_username, u.avatar_url AS author_avatar, u.reputation_score AS author_reputation,
          COALESCE(v.net_votes, 0) AS net_votes,
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.name), NULL) AS tags
        FROM "Question" q
        JOIN "User" u ON q.user_id = u.id
        LEFT JOIN (
          SELECT target_id, SUM(value) AS net_votes
          FROM "Vote"
          WHERE target_type = 'question'
          GROUP BY target_id
        ) v ON v.target_id = q.id
        LEFT JOIN "QuestionTag" qt ON qt.question_id = q.id
        LEFT JOIN "Tag" t ON qt.tag_id = t.id
        WHERE q.id = $1
        GROUP BY q.id, q.title, q.body, q.user_id, q.views, q.created_at, q.updated_at,
                 u.username, u.avatar_url, u.reputation_score, v.net_votes`,
        [questionId]
      );

      if (qRes.rows.length === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const question = qRes.rows[0];

      // Fetch answers ordered: accepted answer first, then highest net votes
      const aRes = await pool.query(
        `SELECT
          a.id, a.question_id, a.user_id, a.user_id AS author_id, a.body, a.is_accepted, a.created_at, a.updated_at,
          u.username AS author_username, u.avatar_url AS author_avatar, u.reputation_score AS author_reputation,
          COALESCE(v.net_votes, 0) AS net_votes
        FROM "Answer" a
        JOIN "User" u ON a.user_id = u.id
        LEFT JOIN (
          SELECT target_id, SUM(value) AS net_votes
          FROM "Vote"
          WHERE target_type = 'answer'
          GROUP BY target_id
        ) v ON v.target_id = a.id
        WHERE a.question_id = $1
        GROUP BY a.id, a.question_id, a.user_id, a.body, a.is_accepted, a.created_at, a.updated_at,
                 u.username, u.avatar_url, u.reputation_score, v.net_votes
        ORDER BY a.is_accepted DESC, net_votes DESC, a.created_at ASC`,
        [questionId]
      );

      return res.json({
        ...question,
        answers: aRes.rows,
      });
    }

    // Memory fallback
    const question = memoryStore.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const viewsCount = (question.views || question.view_count || 0) + 1;
    question.views = viewsCount;
    question.view_count = viewsCount;

    const author = memoryStore.users.find(u => u.id === (question.user_id || question.author_id)) || {
      username: 'anonymous',
      avatar_url: null,
      reputation_score: 1,
    };

    const qVotes = memoryStore.votes.filter(v => v.target_type === 'question' && v.target_id === question.id);
    const net_votes = qVotes.reduce((sum, v) => sum + v.value, 0);

    const answers = memoryStore.answers
      .filter(a => a.question_id === question.id)
      .map(a => {
        const aAuthor = memoryStore.users.find(u => u.id === (a.user_id || a.author_id)) || {
          username: 'anonymous',
          avatar_url: null,
          reputation_score: 1,
        };
        const aVotes = memoryStore.votes.filter(v => v.target_type === 'answer' && v.target_id === a.id);
        const aNetVotes = aVotes.reduce((sum, v) => sum + v.value, 0);

        return {
          id: a.id,
          question_id: a.question_id,
          user_id: a.user_id || a.author_id,
          author_id: a.user_id || a.author_id,
          author_username: aAuthor.username,
          author_avatar: aAuthor.avatar_url,
          author_reputation: aAuthor.reputation_score,
          body: a.body,
          is_accepted: a.is_accepted,
          net_votes: aNetVotes,
          created_at: a.created_at,
          updated_at: a.updated_at,
        };
      })
      .sort((a, b) => {
        if (a.is_accepted !== b.is_accepted) return b.is_accepted ? 1 : -1;
        return b.net_votes - a.net_votes;
      });

    res.json({
      id: question.id,
      title: question.title,
      body: question.body,
      user_id: question.user_id || question.author_id,
      author_id: question.user_id || question.author_id,
      author_username: author.username,
      author_avatar: author.avatar_url,
      author_reputation: author.reputation_score,
      views: viewsCount,
      view_count: viewsCount,
      tags: question.tags || [],
      net_votes,
      answers,
      created_at: question.created_at,
      updated_at: question.updated_at,
    });
  } catch (err) {
    console.error('Get question detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve question detail' });
  }
});

// POST /api/questions
router.post('/', requireAuth, validateQuestion, async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const user_id = req.user.id;

    if (isPostgresAvailable) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const qRes = await client.query(
          'INSERT INTO "Question" (title, body, user_id, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING id, created_at',
          [title, body, user_id]
        );
        const newQuestionId = qRes.rows[0].id;

        // Upsert tags and associate
        for (const tagName of tags) {
          const cleanTag = tagName.trim().toLowerCase();
          const tagRes = await client.query(
            `INSERT INTO "Tag" (name) VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [cleanTag]
          );
          const tagId = tagRes.rows[0].id;

          await client.query(
            'INSERT INTO "QuestionTag" (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [newQuestionId, tagId]
          );
        }

        await client.query('COMMIT');
        return res.status(201).json({
          message: 'Question created successfully',
          questionId: newQuestionId,
        });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    // Memory fallback
    const newId = memoryStore.questions.length > 0 ? Math.max(...memoryStore.questions.map(q => q.id)) + 1 : 1;
    const cleanTags = tags.map(t => t.trim().toLowerCase());

    const newQuestion = {
      id: newId,
      title,
      body,
      user_id,
      author_id: user_id,
      views: 0,
      view_count: 0,
      tags: cleanTags,
      created_at: new Date(),
      updated_at: new Date(),
    };

    memoryStore.questions.unshift(newQuestion);
    res.status(201).json({
      message: 'Question created successfully',
      questionId: newId,
      question: newQuestion,
    });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// PATCH /api/questions/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { title, body, tags } = req.body;

    if (isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    if (!title || !title.trim() || !body || !body.trim()) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    if (isPostgresAvailable) {
      const qRes = await pool.query('SELECT user_id FROM "Question" WHERE id = $1', [questionId]);
      if (qRes.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
      if (qRes.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized to edit this question' });

      await pool.query(
        'UPDATE "Question" SET title = $1, body = $2, updated_at = NOW() WHERE id = $3',
        [title.trim(), body.trim(), questionId]
      );

      if (Array.isArray(tags) && tags.length > 0) {
        await pool.query('DELETE FROM "QuestionTag" WHERE question_id = $1', [questionId]);
        for (const tagName of tags) {
          const cleanTag = String(tagName).trim().toLowerCase();
          if (!cleanTag) continue;

          let tagRow = (await pool.query('SELECT id FROM "Tag" WHERE LOWER(name) = $1', [cleanTag])).rows[0];
          if (!tagRow) {
            const insRes = await pool.query(
              'INSERT INTO "Tag" (name, description) VALUES ($1, $2) RETURNING id',
              [cleanTag, `${cleanTag} programming topic`]
            );
            tagRow = insRes.rows[0];
          }

          await pool.query(
            'INSERT INTO "QuestionTag" (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [questionId, tagRow.id]
          );
        }
      }

      const updated = await pool.query(
        `SELECT q.*, 
                COALESCE((SELECT ARRAY_AGG(t.name) FROM "QuestionTag" qt JOIN "Tag" t ON qt.tag_id = t.id WHERE qt.question_id = q.id), '{}') as tags
         FROM "Question" q WHERE q.id = $1`,
        [questionId]
      );

      return res.json({
        message: 'Question updated successfully',
        question: updated.rows[0],
      });
    }

    // Memory fallback
    const question = memoryStore.questions.find(q => q.id === questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if ((question.user_id || question.author_id) !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this question' });
    }

    question.title = title.trim();
    question.body = body.trim();
    if (Array.isArray(tags)) {
      question.tags = tags.map(t => String(t).trim().toLowerCase());
    }
    question.updated_at = new Date();

    res.json({
      message: 'Question updated successfully',
      question,
    });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isPostgresAvailable) {
      const qRes = await pool.query('SELECT user_id FROM "Question" WHERE id = $1', [questionId]);
      if (qRes.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
      if (qRes.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

      await pool.query('DELETE FROM "Question" WHERE id = $1', [questionId]);
      return res.json({ message: 'Question deleted successfully' });
    }

    const idx = memoryStore.questions.findIndex(q => q.id === questionId);
    if (idx === -1) return res.status(404).json({ error: 'Question not found' });
    if ((memoryStore.questions[idx].user_id || memoryStore.questions[idx].author_id) !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    memoryStore.questions.splice(idx, 1);
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
