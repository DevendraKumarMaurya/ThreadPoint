-- ThreadPoint Initial Seed Data
-- Passwords are all hashed for 'password123'

-- 1. Insert Seed Users
INSERT INTO "User" (id, username, email, password_hash, avatar_url, bio, reputation_score, created_at, updated_at)
VALUES
(1, 'alice_dev', 'alice@example.com', '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 'Distributed systems & PostgreSQL query tuning specialist.', 20, NOW() - INTERVAL '30 days', NOW()),
(2, 'bob_sql', 'bob@example.com', '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 'Full-stack PERN engineer. Passionate about clean code and reactive state.', 25, NOW() - INTERVAL '20 days', NOW()),
(3, 'carol_dba', 'carol@example.com', '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 'Senior Backend Architect. Cloud infrastructure & database triggers.', 50, NOW() - INTERVAL '60 days', NOW()),
(4, 'david_fullstack', 'david@example.com', '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 'TypeScript fanatic & frontend performance enthusiast.', 30, NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  avatar_url = COALESCE("User".avatar_url, EXCLUDED.avatar_url),
  bio = COALESCE("User".bio, EXCLUDED.bio),
  updated_at = NOW();

SELECT setval(pg_get_serial_sequence('"User"', 'id'), (SELECT MAX(id) FROM "User"));

-- 2. Insert Tags
INSERT INTO "Tag" (id, name, description, created_at)
VALUES
(1, 'postgresql', 'Object-relational database management system with emphasis on extensibility and standards compliance.', NOW()),
(2, 'indexing', 'Database structures that improve the speed of data retrieval operations on a database table.', NOW()),
(3, 'triggers', 'Database procedures executed automatically in response to specified database events.', NOW()),
(4, 'react', 'A declarative, efficient, and flexible JavaScript library for building user interfaces.', NOW()),
(5, 'performance', 'Optimizing query execution time and system throughput.', NOW()),
(6, 'full-text-search', 'Techniques for searching a single computer-stored document or a collection in the full text of documents.', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Tag"', 'id'), (SELECT MAX(id) FROM "Tag"));

-- 3. Insert Questions
INSERT INTO "Question" (id, title, body, user_id, views, created_at, updated_at)
VALUES
(
    1,
    'How to enforce single accepted answer in PostgreSQL with conditional unique indexes vs trigger locks?',
    'When designing our technical exchange schema, we need guaranteed consistency where exactly one answer per question has `is_accepted = true`. We tested a partial unique index, but race conditions during concurrent modifications trigger isolation issues under high throughput.

Here is the index we tested:
```sql
CREATE UNIQUE INDEX one_accepted_per_question 
ON "Answer" (question_id) 
WHERE is_accepted = true;
```

Would a `BEFORE INSERT OR UPDATE` trigger with advisory locking be better, or can PostgreSQL guarantee partial unique index consistency under `READ COMMITTED` isolation?',
    2,
    242,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),
(
    2,
    'Optimizing tsvector weighted search on large question titles and bodies with GIN index',
    'We have over 2.5M rows in our questions table. Querying with `to_tsvector` at runtime is causing sequential table scans of 800ms.

We want to precompute the `tsvector` column with weight `A` for the question title and weight `B` for the body. What is the optimal index strategy (GIN vs GiST) and how do we rank results using `ts_rank` without degrading SLA latency?',
    4,
    118,
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours'
),
(
    3,
    'Preventing concurrent double-accept of answers using triggers and partial unique indexes',
    'In our Q&A system, only one answer can be marked accepted per question. If two concurrent requests try to accept different answers, how can we guarantee at the database layer that at most one answer is accepted without table-level locking?',
    1,
    89,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Question"', 'id'), (SELECT MAX(id) FROM "Question"));

-- 4. Insert QuestionTags
INSERT INTO "QuestionTag" (question_id, tag_id)
VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 1),
(2, 6),
(3, 1),
(3, 3)
ON CONFLICT (question_id, tag_id) DO NOTHING;

-- 5. Insert Answers
INSERT INTO "Answer" (id, question_id, user_id, body, is_accepted, created_at, updated_at)
VALUES
(
    1,
    1,
    3,
    'The partial unique index:
```sql
CREATE UNIQUE INDEX one_accepted_per_question 
ON "Answer" (question_id) 
WHERE is_accepted = true;
```
**is 100% atomic and safe under standard PostgreSQL concurrency**, even in default `READ COMMITTED` isolation mode!

### Why this works:
1. PostgreSQL unique indexes acquire unique predicate locks at the physical storage engine layer.
2. If two concurrent transactions attempt to set `is_accepted = true` for the same `question_id`, the second transaction will block until the first commits.
3. Upon commit of transaction 1, transaction 2 immediately raises `duplicate key value violates unique constraint "one_accepted_per_question"`.

### Recommended Belt-and-Suspenders Pattern:
Combine the partial index with a `BEFORE UPDATE` trigger that verifies that the updater is the original question author! That keeps authorization and relational integrity rock solid at the DB layer.',
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
),
(
    2,
    1,
    1,
    'Another approach is to store `accepted_answer_id INT REFERENCES "Answer"(id)` directly in the `Question` table. However, that introduces a mutual foreign key dependency between `Question` and `Answer` requiring deferred constraints. The partial unique index on `Answer` is much cleaner and eliminates circular schema references.',
    false,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Answer"', 'id'), (SELECT MAX(id) FROM "Answer"));

-- 6. Insert Votes
INSERT INTO "Vote" (user_id, target_type, target_id, value, created_at, updated_at)
VALUES
(1, 'question', 1, 1, NOW(), NOW()),
(3, 'question', 1, 1, NOW(), NOW()),
(4, 'question', 1, 1, NOW(), NOW()),
(1, 'answer', 1, 1, NOW(), NOW()),
(2, 'answer', 1, 1, NOW(), NOW()),
(4, 'answer', 1, 1, NOW(), NOW())
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- 7. Insert Comments
INSERT INTO "Comment" (id, user_id, target_type, target_id, body, parent_comment_id, created_at, updated_at)
VALUES
(1, 2, 'question', 1, 'Thanks Elena! We were worried about serialized conflicts but verified the lock behavior.', NULL, NOW() - INTERVAL '1 hour', NOW()),
(2, 3, 'question', 1, 'Glad to help! Make sure your connection pool handles connection retries smoothly.', 1, NOW() - INTERVAL '45 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Comment"', 'id'), (SELECT MAX(id) FROM "Comment"));

-- 8. Synchronize all reputation scores via authoritative reconciliation
SELECT recalculate_user_reputation(id) FROM "User";
