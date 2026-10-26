import express from 'express';
import { prisma, pool, isPostgresAvailable, memoryStore } from '../lib/db.js';

const router = express.Router();

// GET /api/search?q=&type=
// Unified search across questions (tsvector GIN) and users / contributors
router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    const searchType = req.query.type || 'all'; // 'all' | 'questions' | 'users'

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.json({ query: '', count: 0, results: [], questions: [], users: [] });
    }

    const cleanQuery = query.trim();
    const normalizedTerm = cleanQuery.startsWith('@') ? cleanQuery.slice(1).trim() : cleanQuery;

    if (isPostgresAvailable) {
      let questions = [];
      let users = [];

      // 1. Search Questions (unless searchType === 'users')
      if (searchType !== 'users' && normalizedTerm.length > 0) {
        const searchSql = `
          SELECT
            q.id,
            q.title,
            q.body,
            q.user_id,
            q.user_id AS author_id,
            COALESCE(q.views, 0) AS views,
            COALESCE(q.views, 0) AS view_count,
            q.created_at,
            u.username AS author_username,
            u.avatar_url AS author_avatar,
            u.reputation_score AS author_reputation,
            COALESCE(v.net_votes, 0) AS net_votes,
            COALESCE(a.answer_count, 0) AS answer_count,
            COALESCE(a.has_accepted, false) AS has_accepted,
            ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.name), NULL) AS tags,
            COALESCE(ts_rank(q.search_vector, plainto_tsquery('english', $1)), 0) +
            CASE WHEN q.title ILIKE '%' || $1 || '%' THEN 1.0 ELSE 0.0 END AS search_rank,
            ts_headline('english', q.body, plainto_tsquery('english', $1), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS snippet
          FROM "Question" q
          JOIN "User" u ON q.user_id = u.id
          LEFT JOIN (
            SELECT target_id, SUM(value) AS net_votes FROM "Vote" WHERE target_type = 'question' GROUP BY target_id
          ) v ON v.target_id = q.id
          LEFT JOIN (
            SELECT question_id, COUNT(*) AS answer_count, BOOL_OR(is_accepted) AS has_accepted FROM "Answer" GROUP BY question_id
          ) a ON a.question_id = q.id
          LEFT JOIN "QuestionTag" qt ON qt.question_id = q.id
          LEFT JOIN "Tag" t ON qt.tag_id = t.id
          WHERE (
            q.search_vector @@ plainto_tsquery('english', $1)
            OR q.search_vector @@ phraseto_tsquery('english', $1)
            OR q.title ILIKE '%' || $1 || '%'
            OR q.body ILIKE '%' || $1 || '%'
            OR u.username ILIKE '%' || $1 || '%'
            OR EXISTS (
              SELECT 1 FROM "QuestionTag" qt2
              JOIN "Tag" t2 ON qt2.tag_id = t2.id
              WHERE qt2.question_id = q.id AND t2.name ILIKE '%' || $1 || '%'
            )
          )
          GROUP BY q.id, q.title, q.body, q.user_id, q.views, q.created_at,
                   u.username, u.avatar_url, u.reputation_score, v.net_votes, a.answer_count, a.has_accepted, q.search_vector
          ORDER BY search_rank DESC, net_votes DESC
          LIMIT 30;
        `;
        const qRes = await pool.query(searchSql, [normalizedTerm]);
        questions = qRes.rows;
      }

      // 2. Search Users (unless searchType === 'questions')
      if (searchType !== 'questions' && normalizedTerm.length > 0) {
        const userSql = `
          SELECT
            u.id,
            u.username,
            u.avatar_url,
            u.bio,
            u.reputation_score,
            COALESCE(fc.follower_count, 0)::int AS follower_count,
            COALESCE(qc.question_count, 0)::int AS question_count,
            COALESCE(ac.answer_count, 0)::int AS answer_count
          FROM "User" u
          LEFT JOIN (
            SELECT following_id, COUNT(*) AS follower_count 
            FROM "UserFollow" 
            GROUP BY following_id
          ) fc ON fc.following_id = u.id
          LEFT JOIN (
            SELECT user_id, COUNT(*) AS question_count 
            FROM "Question" 
            GROUP BY user_id
          ) qc ON qc.user_id = u.id
          LEFT JOIN (
            SELECT user_id, COUNT(*) AS answer_count 
            FROM "Answer" 
            GROUP BY user_id
          ) ac ON ac.user_id = u.id
          WHERE (
            u.username ILIKE '%' || $1 || '%'
            OR u.bio ILIKE '%' || $1 || '%'
          )
          ORDER BY
            CASE
              WHEN LOWER(u.username) = LOWER($1) THEN 1
              WHEN LOWER(u.username) LIKE LOWER($1) || '%' THEN 2
              ELSE 3
            END,
            u.reputation_score DESC
          LIMIT 10;
        `;
        const uRes = await pool.query(userSql, [normalizedTerm]);
        users = uRes.rows;
      }

      return res.json({
        query: cleanQuery,
        count: questions.length + users.length,
        results: questions,
        questions,
        users,
      });
    }

    // Memory store fallback multi-token search
    const terms = normalizedTerm.toLowerCase().split(/\s+/).filter(Boolean);
    let matchedQuestions = [];
    let matchedUsers = [];

    if (searchType !== 'users' && terms.length > 0) {
      matchedQuestions = memoryStore.questions
        .map(q => {
          const titleLower = q.title.toLowerCase();
          const bodyLower = q.body.toLowerCase();
          const tagsLower = (q.tags || []).map(t => t.toLowerCase());
          const author = memoryStore.users.find(u => u.id === (q.user_id || q.author_id));
          const authorUsername = author ? author.username.toLowerCase() : '';

          let score = 0;
          for (const term of terms) {
            if (titleLower.includes(term)) score += 10;
            if (tagsLower.includes(term)) score += 8;
            if (authorUsername.includes(term)) score += 8;
            if (bodyLower.includes(term)) score += 3;
          }

          if (score === 0) return null;

          const qVotes = (memoryStore.votes || []).filter(v => v.target_type === 'question' && v.target_id === q.id);
          const answers = (memoryStore.answers || []).filter(a => a.question_id === q.id);

          return {
            id: q.id,
            title: q.title,
            body: q.body,
            user_id: q.user_id || q.author_id,
            author_id: q.user_id || q.author_id,
            author_username: author ? author.username : 'anonymous',
            author_reputation: author ? author.reputation_score : 1,
            author_avatar: author ? author.avatar_url : null,
            tags: q.tags || [],
            views: q.views || q.view_count || 0,
            view_count: q.views || q.view_count || 0,
            net_votes: qVotes.reduce((sum, v) => sum + v.value, 0),
            answer_count: answers.length,
            has_accepted: answers.some(a => a.is_accepted),
            created_at: q.created_at,
            search_rank: score,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.search_rank - a.search_rank);
    }

    if (searchType !== 'questions' && terms.length > 0) {
      matchedUsers = (memoryStore.users || [])
        .filter(u => {
          const uName = u.username.toLowerCase();
          const uBio = (u.bio || '').toLowerCase();
          return terms.some(t => uName.includes(t) || uBio.includes(t));
        })
        .map(u => ({
          id: u.id,
          username: u.username,
          avatar_url: u.avatar_url,
          bio: u.bio,
          reputation_score: u.reputation_score,
          follower_count: (memoryStore.follows || []).filter(f => f.following_id === u.id).length,
          question_count: (memoryStore.questions || []).filter(q => (q.user_id || q.author_id) === u.id).length,
          answer_count: (memoryStore.answers || []).filter(a => (a.user_id || a.author_id) === u.id).length,
        }))
        .sort((a, b) => {
          const aExact = a.username.toLowerCase() === normalizedTerm.toLowerCase() ? 1 : a.username.toLowerCase().startsWith(normalizedTerm.toLowerCase()) ? 2 : 3;
          const bExact = b.username.toLowerCase() === normalizedTerm.toLowerCase() ? 1 : b.username.toLowerCase().startsWith(normalizedTerm.toLowerCase()) ? 2 : 3;
          if (aExact !== bExact) return aExact - bExact;
          return b.reputation_score - a.reputation_score;
        })
        .slice(0, 10);
    }

    res.json({
      query: cleanQuery,
      count: matchedQuestions.length + matchedUsers.length,
      results: matchedQuestions,
      questions: matchedQuestions,
      users: matchedUsers,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
