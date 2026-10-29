import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const connectionString = process.env.DATABASE_URL;
const isCloudOrSsl = connectionString && (
  connectionString.includes('sslmode=') ||
  connectionString.includes('aivencloud.com') ||
  connectionString.includes('neon.tech') ||
  connectionString.includes('supabase.co') ||
  connectionString.includes('render.com') ||
  (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'))
);

const cleanConnectionString = isCloudOrSsl
  ? connectionString.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
  : connectionString;

export const pool = new Pool({
  connectionString: cleanConnectionString,
  connectionTimeoutMillis: 10000,
  ssl: isCloudOrSsl ? { rejectUnauthorized: false } : undefined,
});

export let isPostgresAvailable = false;

// High-fidelity fallback state populated with initial data matching 04_seed.sql
export const memoryStore = {
  users: [
    {
      id: 1,
      username: 'alice_dev',
      email: 'alice@example.com',
      password_hash: '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK', // 'password123'
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      bio: 'Researcher & Educator. Passionate about community knowledge sharing.',
      reputation_score: 43,
      is_google_auth: false,
      auth_provider: 'local',
      google_id: null,
      is_email_verified: true,
      created_at: new Date(Date.now() - 30 * 86400000),
    },
    {
      id: 2,
      username: 'bob_sql',
      email: 'bob@example.com',
      password_hash: '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      bio: 'Design Thinker & Lifestyle Consultant. Exploring human-centered systems.',
      reputation_score: 28,
      is_google_auth: false,
      auth_provider: 'local',
      google_id: null,
      is_email_verified: true,
      created_at: new Date(Date.now() - 20 * 86400000),
    },
    {
      id: 3,
      username: 'carol_dba',
      email: 'carol@example.com',
      password_hash: '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      bio: 'Community Curator & Knowledge Specialist. Lifelong learner & writer.',
      reputation_score: 61,
      is_google_auth: false,
      auth_provider: 'local',
      google_id: null,
      is_email_verified: true,
      created_at: new Date(Date.now() - 60 * 86400000),
    },
    {
      id: 4,
      username: 'david_fullstack',
      email: 'david@example.com',
      password_hash: '$2a$10$bk84KA9m/IWIA2uNd.ztQ.gOJ7bBgTmErHaXBG/5buDKCji/xN2zK',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      bio: 'Community Strategist & Avid Reader. Passionate about learning habits.',
      reputation_score: 33,
      is_google_auth: false,
      auth_provider: 'local',
      google_id: null,
      is_email_verified: true,
      created_at: new Date(Date.now() - 10 * 86400000),
    },
  ],
  otps: [], // [{ id, email, otp_hash, purpose, attempts, expires_at, created_at }]
  tags: [
    { id: 1, name: 'technology', description: 'Technological innovations, tools, digital culture, and software insights.' },
    { id: 2, name: 'productivity', description: 'Time management, focus techniques, workflows, and life organization habits.' },
    { id: 3, name: 'science', description: 'Natural sciences, physics, astronomy, psychology, and evidence-based inquiry.' },
    { id: 4, name: 'career', description: 'Professional growth, career transitions, mentorship, and workplace navigation.' },
    { id: 5, name: 'design', description: 'Visual thinking, UI/UX, product design, typography, and creative process.' },
    { id: 6, name: 'lifestyle', description: 'Health, wellness, personal finance, books, and sustainable everyday habits.' },
    { id: 7, name: 'learning', description: 'Study strategies, mental models, books, and lifelong curiosity.' },
  ],
  questions: [
    {
      id: 1,
      title: 'How to enforce single accepted answer in PostgreSQL with conditional unique indexes vs trigger locks?',
      body: `When designing our technical exchange schema, we need guaranteed consistency where exactly one answer per question has \`is_accepted = true\`. We tested a partial unique index, but race conditions during concurrent modifications trigger isolation issues under high throughput.

Here is the index we tested:
\`\`\`sql
CREATE UNIQUE INDEX one_accepted_per_question 
ON "Answer" (question_id) 
WHERE is_accepted = true;
\`\`\`

Would a \`BEFORE INSERT OR UPDATE\` trigger with advisory locking be better, or can PostgreSQL guarantee partial unique index consistency under \`READ COMMITTED\` isolation?`,
      author_id: 2,
      view_count: 2420,
      tags: ['postgresql', 'triggers', 'indexing', 'concurrency'],
      created_at: new Date(Date.now() - 3 * 3600000),
      updated_at: new Date(Date.now() - 3 * 3600000),
    },
    {
      id: 2,
      title: 'Optimizing tsvector weighted search on large question titles and bodies with GIN index',
      body: `We have over 2.5M rows in our questions table. Querying with \`to_tsvector\` at runtime is causing sequential table scans of 800ms.

We want to precompute the \`tsvector\` column with weight \`A\` for the question title and weight \`B\` for the body. What is the optimal index strategy (GIN vs GiST) and how do we rank results using \`ts_rank\` without degrading SLA latency?`,
      author_id: 4,
      view_count: 1180,
      tags: ['postgresql', 'full-text-search', 'indexing'],
      created_at: new Date(Date.now() - 8 * 3600000),
      updated_at: new Date(Date.now() - 8 * 3600000),
    },
    {
      id: 3,
      title: 'Managing recursive CTE execution for deeply nested comment trees in PostgreSQL',
      body: `When building threaded comment replies (Reddit/HackerNews style), we want to fetch the entire tree of comments in a single query sorted in depth-first order.

Is \`WITH RECURSIVE\` performant for hierarchies with depths up to 10 levels, or should we switch to ltree / materialized path patterns for production workloads?`,
      author_id: 1,
      view_count: 890,
      tags: ['postgresql', 'concurrency'],
      created_at: new Date(Date.now() - 24 * 3600000),
      updated_at: new Date(Date.now() - 24 * 3600000),
    },
  ],
  answers: [
    {
      id: 1,
      question_id: 1,
      author_id: 3,
      body: `The partial unique index:
\`\`\`sql
CREATE UNIQUE INDEX one_accepted_per_question 
ON "Answer" (question_id) 
WHERE is_accepted = true;
\`\`\`
**is 100% atomic and safe under standard PostgreSQL concurrency**, even in default \`READ COMMITTED\` isolation mode!

### Why this works:
1. PostgreSQL unique indexes acquire unique predicate locks at the physical storage engine layer.
2. If two concurrent transactions attempt to set \`is_accepted = true\` for the same \`question_id\`, the second transaction will block until the first commits.
3. Upon commit of transaction 1, transaction 2 immediately raises \`duplicate key value violates unique constraint "one_accepted_per_question"\`.

### Recommended Belt-and-Suspenders Pattern:
Combine the partial index with a \`BEFORE UPDATE\` trigger that verifies that the updater is the original question author! That keeps authorization and relational integrity rock solid at the DB layer.`,
      is_accepted: true,
      created_at: new Date(Date.now() - 2 * 3600000),
      updated_at: new Date(Date.now() - 2 * 3600000),
    },
    {
      id: 2,
      question_id: 1,
      author_id: 1,
      body: `Another approach is to store \`accepted_answer_id INT REFERENCES "Answer"(id)\` directly in the \`Question\` table. However, that introduces a mutual foreign key dependency between \`Question\` and \`Answer\` requiring deferred constraints. The partial unique index on \`Answer\` is much cleaner and eliminates circular schema references.`,
      is_accepted: false,
      created_at: new Date(Date.now() - 1 * 3600000),
      updated_at: new Date(Date.now() - 1 * 3600000),
    },
    {
      id: 3,
      question_id: 2,
      author_id: 3,
      body: `For 2.5M rows, precomputing a stored generated column with GIN index is the industry standard:

\`\`\`sql
ALTER TABLE "Question" ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'B')
) STORED;

CREATE INDEX idx_question_fts ON "Question" USING GIN (search_vector);
\`\`\`

### Querying:
\`\`\`sql
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM "Question", to_tsquery('english', 'postgresql & triggers') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
\`\`\`
Execution time will drop from 800ms to sub-5ms.`,
      is_accepted: false,
      created_at: new Date(Date.now() - 5 * 3600000),
      updated_at: new Date(Date.now() - 5 * 3600000),
    },
  ],
  votes: [
    { id: 1, user_id: 1, target_type: 'question', target_id: 1, value: 1 },
    { id: 2, user_id: 3, target_type: 'question', target_id: 1, value: 1 },
    { id: 3, user_id: 4, target_type: 'question', target_id: 1, value: 1 },
    { id: 4, user_id: 1, target_type: 'answer', target_id: 1, value: 1 },
    { id: 5, user_id: 2, target_type: 'answer', target_id: 1, value: 1 },
    { id: 6, user_id: 4, target_type: 'answer', target_id: 1, value: 1 },
    { id: 7, user_id: 2, target_type: 'question', target_id: 2, value: 1 },
    { id: 8, user_id: 3, target_type: 'question', target_id: 2, value: 1 },
    { id: 9, user_id: 1, target_type: 'question', target_id: 3, value: 1 },
  ],
  comments: [
    {
      id: 1,
      user_id: 2,
      target_type: 'question',
      target_id: 1,
      body: 'Thanks Elena! We were worried about serialized conflicts but verified the lock behavior.',
      parent_comment_id: null,
      created_at: new Date(Date.now() - 3600000),
    },
    {
      id: 2,
      user_id: 3,
      target_type: 'question',
      target_id: 1,
      body: 'Glad to help! Make sure your connection pool handles connection retries smoothly.',
      parent_comment_id: 1,
      created_at: new Date(Date.now() - 2700000),
    },
    {
      id: 3,
      user_id: 4,
      target_type: 'answer',
      target_id: 1,
      body: 'This benchmarked at 0.038ms in our staging environment. Outstanding solution.',
      parent_comment_id: null,
      created_at: new Date(Date.now() - 1800000),
    },
  ],
  bookmarks: [
    { id: 1, user_id: 1, question_id: 1, created_at: new Date() },
  ],
  follows: [
    { id: 1, follower_id: 1, following_id: 3, created_at: new Date() },
    { id: 2, follower_id: 2, following_id: 3, created_at: new Date() },
    { id: 3, follower_id: 3, following_id: 1, created_at: new Date() },
  ],
  badges: [
    { id: 1, name: 'First Question', description: 'Asked their first question on ThreadPoint', icon: 'HelpCircle', tier: 'bronze' },
    { id: 2, name: 'First Answer', description: 'Contributed an answer to help another community member', icon: 'MessageSquare', tier: 'bronze' },
    { id: 3, name: 'Problem Solver', description: 'Had an answer accepted as the verified solution', icon: 'CheckCircle2', tier: 'silver' },
    { id: 4, name: 'Popular Question', description: 'Authored a question that received 5 or more upvotes', icon: 'Flame', tier: 'bronze' },
    { id: 5, name: 'Good Answer', description: 'Authored an answer that received 10 or more upvotes', icon: 'Award', tier: 'silver' },
    { id: 6, name: 'Community Scholar', description: 'Attained a reputation score of 100 or higher', icon: 'Sparkles', tier: 'gold' },
    { id: 7, name: 'Conversation Starter', description: 'Attracted 5 or more community followers', icon: 'Users', tier: 'bronze' },
    { id: 8, name: 'Master Contributor', description: 'Authored 5 or more accepted answers', icon: 'ShieldCheck', tier: 'gold' },
  ],
  userBadges: [
    { id: 1, user_id: 1, badge_id: 1, awarded_at: new Date(Date.now() - 86400000 * 5) },
    { id: 2, user_id: 3, badge_id: 2, awarded_at: new Date(Date.now() - 86400000 * 4) },
    { id: 3, user_id: 3, badge_id: 3, awarded_at: new Date(Date.now() - 86400000 * 3) },
  ],
  notifications: [
    {
      id: 1,
      recipient_id: 1,
      actor_id: 3,
      type: 'answer',
      target_type: 'question',
      target_id: 1,
      title: 'New answer to your question',
      message: 'carol_dba posted an answer to your question',
      is_read: false,
      created_at: new Date(Date.now() - 3600000),
    },
    {
      id: 2,
      recipient_id: 3,
      actor_id: 1,
      type: 'accept',
      target_type: 'answer',
      target_id: 1,
      title: 'Answer accepted',
      message: 'alice_dev marked your answer as accepted solution (+15 reputation)',
      is_read: false,
      created_at: new Date(Date.now() - 1800000),
    },
    {
      id: 3,
      recipient_id: 3,
      actor_id: 2,
      type: 'follow',
      target_type: 'user',
      target_id: 3,
      title: 'New follower',
      message: 'bob_sql started following your profile',
      is_read: true,
      created_at: new Date(Date.now() - 7200000),
    },
  ],
  tagFollows: [
    { id: 1, user_id: 1, tag_id: 1, created_at: new Date() },
    { id: 2, user_id: 1, tag_id: 3, created_at: new Date() },
  ],
  reports: [],
};

// Calculate user reputation in memory store using exact reconciliation rules
export function syncMemoryUserReputation(userId) {
  const user = memoryStore.users.find(u => u.id === userId);
  if (!user) return;

  let rep = 1;

  // Votes on user's questions
  for (const q of memoryStore.questions.filter(q => (q.author_id === userId || q.user_id === userId))) {
    const qVotes = memoryStore.votes.filter(v => v.target_type === 'question' && v.target_id === q.id);
    for (const v of qVotes) {
      rep += v.value === 1 ? 10 : -2;
    }
  }

  // Votes on user's answers
  for (const a of memoryStore.answers.filter(a => (a.author_id === userId || a.user_id === userId))) {
    const aVotes = memoryStore.votes.filter(v => v.target_type === 'answer' && v.target_id === a.id);
    for (const v of aVotes) {
      rep += v.value === 1 ? 10 : -2;
    }
    if (a.is_accepted) {
      rep += 15;
    }
  }

  // Accepted answers on user's questions
  for (const q of memoryStore.questions.filter(q => (q.author_id === userId || q.user_id === userId))) {
    const hasAccepted = memoryStore.answers.some(a => a.question_id === q.id && a.is_accepted);
    if (hasAccepted) {
      rep += 2;
    }
  }

  user.reputation_score = Math.max(1, rep);
  return user.reputation_score;
}

// Create in-app notification
export async function createNotification({ recipient_id, actor_id, type, target_type, target_id, title, message }) {
  if (recipient_id === actor_id) return null;

  if (isPostgresAvailable) {
    try {
      const res = await pool.query(
        `INSERT INTO "Notification" (recipient_id, actor_id, type, target_type, target_id, title, message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [recipient_id, actor_id, type, target_type, target_id, title, message]
      );
      return res.rows[0];
    } catch (err) {
      console.error('Error creating notification in PostgreSQL:', err.message);
    }
  }

  if (!memoryStore.notifications) memoryStore.notifications = [];
  const newId = memoryStore.notifications.length > 0 ? Math.max(...memoryStore.notifications.map(n => n.id)) + 1 : 1;
  const notif = {
    id: newId,
    recipient_id,
    actor_id,
    type,
    target_type,
    target_id,
    title,
    message,
    is_read: false,
    created_at: new Date(),
  };
  memoryStore.notifications.unshift(notif);
  return notif;
}

// Evaluate milestones and award badges
export async function evaluateAndAwardBadges(userId) {
  if (!userId) return [];

  if (isPostgresAvailable) {
    try {
      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'First Question'
          AND EXISTS (SELECT 1 FROM "Question" WHERE user_id = $1)
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'First Answer'
          AND EXISTS (SELECT 1 FROM "Answer" WHERE user_id = $1)
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'Problem Solver'
          AND EXISTS (SELECT 1 FROM "Answer" WHERE user_id = $1 AND is_accepted = true)
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'Master Contributor'
          AND (SELECT COUNT(*) FROM "Answer" WHERE user_id = $1 AND is_accepted = true) >= 5
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'Popular Question'
          AND EXISTS (
            SELECT 1 FROM "Question" q
            JOIN "Vote" v ON v.target_type = 'question' AND v.target_id = q.id
            WHERE q.user_id = $1
            GROUP BY q.id
            HAVING SUM(v.value) >= 5
          )
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'Good Answer'
          AND EXISTS (
            SELECT 1 FROM "Answer" a
            JOIN "Vote" v ON v.target_type = 'answer' AND v.target_id = a.id
            WHERE a.user_id = $1
            GROUP BY a.id
            HAVING SUM(v.value) >= 10
          )
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'Community Scholar'
          AND (SELECT reputation_score FROM "User" WHERE id = $1) >= 100
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      await pool.query(`
        INSERT INTO "UserBadge" (user_id, badge_id, awarded_at)
        SELECT $1, b.id, NOW()
        FROM "Badge" b
        WHERE b.name = 'Conversation Starter'
          AND (SELECT COUNT(*) FROM "UserFollow" WHERE following_id = $1) >= 5
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `, [userId]);

      const res = await pool.query(`
        SELECT b.id, b.name, b.description, b.icon, b.tier, ub.awarded_at
        FROM "UserBadge" ub
        JOIN "Badge" b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.awarded_at DESC
      `, [userId]);
      return res.rows;
    } catch (err) {
      console.error('Error evaluating badges:', err.message);
      return [];
    }
  }

  // Memory fallback
  if (!memoryStore.userBadges) memoryStore.userBadges = [];
  const qCount = memoryStore.questions.filter(q => (q.author_id === userId || q.user_id === userId)).length;
  const answers = memoryStore.answers.filter(a => (a.author_id === userId || a.user_id === userId));
  const aCount = answers.length;
  const acceptedCount = answers.filter(a => a.is_accepted).length;
  const user = memoryStore.users.find(u => u.id === userId);
  const rep = user ? user.reputation_score : 1;
  const followersCount = (memoryStore.follows || []).filter(f => f.following_id === userId).length;

  const awardIfEligible = (badgeName, eligible) => {
    if (!eligible) return;
    const badge = memoryStore.badges.find(b => b.name === badgeName);
    if (!badge) return;
    const exists = memoryStore.userBadges.some(ub => ub.user_id === userId && ub.badge_id === badge.id);
    if (!exists) {
      const newId = memoryStore.userBadges.length > 0 ? Math.max(...memoryStore.userBadges.map(x => x.id)) + 1 : 1;
      memoryStore.userBadges.push({
        id: newId,
        user_id: userId,
        badge_id: badge.id,
        awarded_at: new Date(),
      });
    }
  };

  awardIfEligible('First Question', qCount >= 1);
  awardIfEligible('First Answer', aCount >= 1);
  awardIfEligible('Problem Solver', acceptedCount >= 1);
  awardIfEligible('Master Contributor', acceptedCount >= 5);
  awardIfEligible('Community Scholar', rep >= 100);
  awardIfEligible('Conversation Starter', followersCount >= 5);

  return memoryStore.userBadges
    .filter(ub => ub.user_id === userId)
    .map(ub => {
      const b = memoryStore.badges.find(x => x.id === ub.badge_id);
      return {
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        tier: b.tier,
        awarded_at: ub.awarded_at,
      };
    });
}

// Probe database connectivity and ensure schema readiness
async function autoInitPostgres(client) {
  const sqlDir = path.resolve(__dirname, '../../../sql');
  const fallbackSqlDir = path.resolve(__dirname, '../../sql');
  const targetDir = fs.existsSync(fallbackSqlDir) ? fallbackSqlDir : sqlDir;

  const sqlFiles = ['01_schema.sql', '02_triggers.sql', '03_views.sql', '04_seed.sql'];
  for (const fileName of sqlFiles) {
    const filePath = path.join(targetDir, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`[DB-AUTO-INIT] Executing ${fileName}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`[DB-AUTO-INIT] Completed ${fileName}`);
    }
  }
}

export async function testDbConnection() {
  if (!connectionString) {
    isPostgresAvailable = false;
    console.log('[DB] DATABASE_URL is not set.');
    console.log('[DB] Running in high-fidelity mock fallback mode with complete sample data.');
    return false;
  }

  let client;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time');
    console.log(`[DB] Connected to PostgreSQL at ${res.rows[0].current_time}`);

    // Check if tables already exist
    const checkRes = await client.query(`SELECT to_regclass('public."User"') as user_table`);
    if (!checkRes.rows[0].user_table) {
      console.log('[DB] Database tables not found. Automatically initializing schema & triggers...');
      await autoInitPostgres(client);
      console.log('[DB] Database schema and initial data initialized successfully.');
    } else {
      console.log('[DB] PostgreSQL schema & tables verified.');
    }

    isPostgresAvailable = true;
    return true;
  } catch (err) {
    isPostgresAvailable = false;
    console.warn(`[DB] PostgreSQL connection/init issue: ${err.message}`);
    console.log('[DB] Running in high-fidelity mock fallback mode with complete sample data.');
    return false;
  } finally {
    if (client) client.release();
  }
}

