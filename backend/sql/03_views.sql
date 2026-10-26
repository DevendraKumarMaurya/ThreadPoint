-- ====================================================================
-- ThreadPoint Views
-- 1. hot_questions: View for trending questions with time-decay scoring
-- 2. user_leaderboard: Aggregated view for user rankings & reputations
-- ====================================================================

-- Drop views first to allow column list evolution safely
DROP VIEW IF EXISTS hot_questions CASCADE;
DROP VIEW IF EXISTS user_leaderboard CASCADE;

-- --------------------------------------------------------------------
-- 1. hot_questions View
-- Surfaces questions ranked by recency, votes, answers, and acceptance
-- --------------------------------------------------------------------
CREATE OR REPLACE VIEW hot_questions AS
SELECT
    q.id,
    q.title,
    q.body,
    q.user_id,
    q.user_id AS author_id,
    q.views,
    q.views AS view_count,
    q.created_at,
    q.updated_at,
    COALESCE(v.net_votes, 0) AS net_votes,
    COALESCE(a.answer_count, 0) AS answer_count,
    COALESCE(a.has_accepted, false) AS has_accepted,
    u.username AS author_username,
    u.reputation_score AS author_reputation,
    u.avatar_url AS author_avatar,
    ARRAY_REMOVE(ARRAY_AGG(t.name), NULL) AS tags,
    ROUND(
        ( (COALESCE(v.net_votes, 0) * 10.0 + COALESCE(a.answer_count, 0) * 5.0 + q.views * 0.1 + 10.0) /
          POWER((EXTRACT(EPOCH FROM (NOW() - q.created_at)) / 3600.0 + 2.0), 1.5)
        )::numeric, 4
    ) AS hot_score
FROM "Question" q
JOIN "User" u ON q.user_id = u.id
LEFT JOIN (
    SELECT target_id, SUM(value) AS net_votes
    FROM "Vote"
    WHERE target_type = 'question'
    GROUP BY target_id
) v ON v.target_id = q.id
LEFT JOIN (
    SELECT
        question_id,
        COUNT(*) AS answer_count,
        BOOL_OR(is_accepted) AS has_accepted
    FROM "Answer"
    GROUP BY question_id
) a ON a.question_id = q.id
LEFT JOIN "QuestionTag" qt ON qt.question_id = q.id
LEFT JOIN "Tag" t ON qt.tag_id = t.id
GROUP BY q.id, q.title, q.body, q.user_id, q.views, q.created_at, q.updated_at,
         v.net_votes, a.answer_count, a.has_accepted, u.username, u.reputation_score, u.avatar_url;

-- --------------------------------------------------------------------
-- 2. user_leaderboard View
-- --------------------------------------------------------------------
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT
    u.id,
    u.username,
    u.avatar_url,
    u.bio,
    u.reputation_score,
    u.created_at,
    COALESCE(qc.question_count, 0) AS question_count,
    COALESCE(ac.answer_count, 0) AS answer_count,
    COALESCE(acc.accepted_count, 0) AS accepted_count
FROM "User" u
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
LEFT JOIN (
    SELECT user_id, COUNT(*) AS accepted_count
    FROM "Answer"
    WHERE is_accepted = TRUE
    GROUP BY user_id
) acc ON acc.user_id = u.id
ORDER BY u.reputation_score DESC, question_count DESC;
