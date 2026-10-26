import express from 'express';
import { prisma, pool, isPostgresAvailable, memoryStore, createNotification } from '../lib/db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validateComment } from '../middleware/validate.js';

const router = express.Router();

// GET /api/comments?target_type=question&target_id=1
// Uses Recursive CTE in PostgreSQL to construct hierarchical threaded comment trees
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { target_type, target_id } = req.query;

    if (!target_type || !target_id) {
      return res.status(400).json({ error: 'target_type and target_id are required query parameters' });
    }

    const targetId = parseInt(target_id, 10);

    if (isPostgresAvailable) {
      const recursiveSql = `
        WITH RECURSIVE CommentTree AS (
          -- Anchor: Root comments (no parent)
          SELECT
            c.id, c.user_id, c.target_type, c.target_id, c.body, c.parent_comment_id, c.created_at,
            u.username AS author_username, u.avatar_url AS author_avatar, u.reputation_score AS author_reputation,
            0 AS depth,
            ARRAY[c.id] AS path
          FROM "Comment" c
          JOIN "User" u ON c.user_id = u.id
          WHERE c.target_type = $1 AND c.target_id = $2 AND c.parent_comment_id IS NULL

          UNION ALL

          -- Recursive member: Child replies
          SELECT
            c.id, c.user_id, c.target_type, c.target_id, c.body, c.parent_comment_id, c.created_at,
            u.username AS author_username, u.avatar_url AS author_avatar, u.reputation_score AS author_reputation,
            ct.depth + 1,
            ct.path || c.id
          FROM "Comment" c
          JOIN "User" u ON c.user_id = u.id
          JOIN CommentTree ct ON c.parent_comment_id = ct.id
        )
        SELECT * FROM CommentTree ORDER BY path;
      `;

      const result = await pool.query(recursiveSql, [target_type, targetId]);
      return res.json({ comments: result.rows });
    }

    // Memory fallback hierarchical build
    const filtered = memoryStore.comments.filter(
      c => c.target_type === target_type && c.target_id === targetId
    );

    function buildTree(parentId = null, depth = 0) {
      const branch = [];
      const children = filtered.filter(c => c.parent_comment_id === parentId);
      for (const c of children) {
        const author = memoryStore.users.find(u => u.id === c.user_id) || {
          username: 'anonymous',
          avatar_url: null,
          reputation_score: 1,
        };
        branch.push({
          id: c.id,
          user_id: c.user_id,
          target_type: c.target_type,
          target_id: c.target_id,
          body: c.body,
          parent_comment_id: c.parent_comment_id,
          created_at: c.created_at,
          author_username: author.username,
          author_avatar: author.avatar_url,
          author_reputation: author.reputation_score,
          depth,
          replies: buildTree(c.id, depth + 1),
        });
      }
      return branch;
    }

    res.json({ comments: buildTree(null, 0) });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// POST /api/comments
router.post('/', requireAuth, validateComment, async (req, res) => {
  try {
    const { target_type, target_id, body, parent_comment_id } = req.body;
    const user_id = req.user.id;
    const targetId = parseInt(target_id, 10);
    const parentId = parent_comment_id ? parseInt(parent_comment_id, 10) : null;

    if (isPostgresAvailable) {
      const cRes = await pool.query(
        `INSERT INTO "Comment" (user_id, target_type, target_id, body, parent_comment_id, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, user_id, target_type, target_id, body, parent_comment_id, created_at`,
        [user_id, target_type, targetId, body, parentId]
      );

      const userRes = await pool.query(
        'SELECT username, avatar_url, reputation_score FROM "User" WHERE id = $1',
        [user_id]
      );

      // Determine recipient for notification
      let recipientId = null;
      if (target_type === 'question') {
        const qOwner = await pool.query('SELECT user_id FROM "Question" WHERE id = $1', [targetId]);
        recipientId = qOwner.rows[0]?.user_id;
      } else if (target_type === 'answer') {
        const aOwner = await pool.query('SELECT user_id FROM "Answer" WHERE id = $1', [targetId]);
        recipientId = aOwner.rows[0]?.user_id;
      }

      if (recipientId && recipientId !== user_id) {
        await createNotification({
          recipient_id: recipientId,
          actor_id: user_id,
          type: 'comment',
          target_type,
          target_id: targetId,
          title: `New comment on your ${target_type}`,
          message: `${userRes.rows[0].username} commented: "${body.slice(0, 50)}..."`,
        });
      }

      return res.status(201).json({
        message: 'Comment posted successfully',
        comment: {
          ...cRes.rows[0],
          author_username: userRes.rows[0].username,
          author_avatar: userRes.rows[0].avatar_url,
          author_reputation: userRes.rows[0].reputation_score,
        },
      });
    }

    // Memory fallback
    const newId = memoryStore.comments.length > 0 ? Math.max(...memoryStore.comments.map(c => c.id)) + 1 : 1;
    const author = memoryStore.users.find(u => u.id === user_id);

    const newComment = {
      id: newId,
      user_id,
      target_type,
      target_id: targetId,
      body,
      parent_comment_id: parentId,
      author_username: author ? author.username : req.user.username,
      author_avatar: author ? author.avatar_url : null,
      author_reputation: author ? author.reputation_score : 1,
      created_at: new Date(),
    };

    memoryStore.comments.push(newComment);

    let memRecipientId = null;
    if (target_type === 'question') {
      const q = memoryStore.questions.find(x => x.id === targetId);
      memRecipientId = q?.user_id || q?.author_id;
    } else if (target_type === 'answer') {
      const a = memoryStore.answers.find(x => x.id === targetId);
      memRecipientId = a?.user_id || a?.author_id;
    }

    if (memRecipientId && memRecipientId !== user_id) {
      createNotification({
        recipient_id: memRecipientId,
        actor_id: user_id,
        type: 'comment',
        target_type,
        target_id: targetId,
        title: `New comment on your ${target_type}`,
        message: `${newComment.author_username} commented: "${body.slice(0, 50)}..."`,
      });
    }

    res.status(201).json({
      message: 'Comment posted successfully',
      comment: newComment,
    });
  } catch (err) {
    console.error('Post comment error:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

export default router;
