import express from 'express';
import { prisma, pool, isPostgresAvailable, memoryStore, syncMemoryUserReputation, createNotification, evaluateAndAwardBadges } from '../lib/db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to resolve user by numeric id or username
async function resolveUser(identifier) {
  const isNumeric = /^\d+$/.test(String(identifier).trim());
  const clean = String(identifier).trim();

  if (isPostgresAvailable) {
    if (isNumeric) {
      const res = await pool.query(
        'SELECT id, username, email, avatar_url, bio, reputation_score, location, github_url, website_url, is_google_auth, auth_provider, is_email_verified, created_at FROM "User" WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(email) = LOWER($2)',
        [parseInt(clean, 10), clean]
      );
      return res.rows[0] || null;
    } else {
      const res = await pool.query(
        'SELECT id, username, email, avatar_url, bio, reputation_score, location, github_url, website_url, is_google_auth, auth_provider, is_email_verified, created_at FROM "User" WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
        [clean]
      );
      return res.rows[0] || null;
    }
  }

  // Memory fallback
  if (isNumeric) {
    const idNum = parseInt(clean, 10);
    return memoryStore.users.find(u => u.id === idNum || u.username.toLowerCase() === clean.toLowerCase() || u.email.toLowerCase() === clean.toLowerCase()) || null;
  }
  return memoryStore.users.find(u => u.username.toLowerCase() === clean.toLowerCase() || u.email.toLowerCase() === clean.toLowerCase()) || null;
}

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    if (isPostgresAvailable) {
      // Reconcile all users' reputation scores to ensure absolute consistency
      await pool.query('SELECT recalculate_user_reputation(id) FROM "User"');
      const result = await pool.query('SELECT * FROM user_leaderboard LIMIT 10');
      return res.json({ leaderboard: result.rows });
    }

    // Memory fallback
    memoryStore.users.forEach(u => syncMemoryUserReputation(u.id));

    const leaderboard = memoryStore.users
      .map(u => {
        const question_count = memoryStore.questions.filter(q => (q.user_id || q.author_id) === u.id).length;
        const answers = memoryStore.answers.filter(a => (a.user_id || a.author_id) === u.id);
        const answer_count = answers.length;
        const accepted_count = answers.filter(a => a.is_accepted).length;

        return {
          id: u.id,
          username: u.username,
          avatar_url: u.avatar_url,
          bio: u.bio,
          reputation_score: u.reputation_score,
          question_count,
          answer_count,
          accepted_count,
        };
      })
      .sort((a, b) => b.reputation_score - a.reputation_score)
      .slice(0, 10);

    res.json({ leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

// PATCH /api/users/profile - Update user profile information
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, bio, avatar_url, location, github_url, website_url } = req.body;

    let targetUsername = undefined;
    if (username !== undefined) {
      const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
      }

      if (isPostgresAvailable) {
        const existing = await pool.query(
          'SELECT id FROM "User" WHERE LOWER(username) = LOWER($1) AND id != $2',
          [cleanUsername, userId]
        );
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'Username is already taken by another contributor.' });
        }
      } else {
        const existing = memoryStore.users.find(
          u => u.username.toLowerCase() === cleanUsername && u.id !== userId
        );
        if (existing) {
          return res.status(400).json({ error: 'Username is already taken by another contributor.' });
        }
      }
      targetUsername = cleanUsername;
    }

    if (isPostgresAvailable) {
      const result = await pool.query(
        `UPDATE "User"
         SET username = COALESCE($1, username),
             bio = COALESCE($2, bio),
             avatar_url = COALESCE($3, avatar_url),
             location = COALESCE($4, location),
             github_url = COALESCE($5, github_url),
             website_url = COALESCE($6, website_url),
             updated_at = NOW()
         WHERE id = $7
         RETURNING id, username, email, avatar_url, bio, reputation_score, location, github_url, website_url, is_google_auth, auth_provider, is_email_verified, created_at`,
        [targetUsername || null,
         bio !== undefined ? String(bio).trim() : null,
         avatar_url !== undefined ? String(avatar_url).trim() : null,
         location !== undefined ? String(location).trim() : null,
         github_url !== undefined ? String(github_url).trim() : null,
         website_url !== undefined ? String(website_url).trim() : null,
         userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    }

    // Memory fallback
    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUsername !== undefined) user.username = targetUsername;
    if (bio !== undefined) user.bio = String(bio).trim();
    if (avatar_url !== undefined) user.avatar_url = String(avatar_url).trim();
    if (location !== undefined) user.location = String(location).trim();
    if (github_url !== undefined) user.github_url = String(github_url).trim();
    if (website_url !== undefined) user.website_url = String(website_url).trim();
    user.updated_at = new Date();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        github_url: user.github_url,
        website_url: user.website_url,
        reputation_score: user.reputation_score,
        is_google_auth: Boolean(user.is_google_auth),
        auth_provider: user.auth_provider || 'local',
        is_email_verified: Boolean(user.is_email_verified),
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/:identifier (Supports username, email, numeric ID, and 'me')
router.get('/:identifier', optionalAuth, async (req, res) => {
  try {
    let { identifier } = req.params;
    const currentUserId = req.user?.id || null;

    if (identifier === 'me' || identifier === 'profile') {
      if (!currentUserId) {
        return res.status(401).json({ error: 'Authentication required to view your profile' });
      }
      identifier = String(currentUserId);
    }

    const user = await resolveUser(identifier);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;

    if (isPostgresAvailable) {
      // Reconcile user reputation before returning profile
      await pool.query('SELECT recalculate_user_reputation($1)', [userId]);

      const qRes = await pool.query(
        'SELECT id, title, COALESCE(views, 0) AS views, COALESCE(views, 0) AS view_count, created_at FROM "Question" WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      const aRes = await pool.query(
        `SELECT a.id, a.question_id, a.body, a.is_accepted, a.created_at, q.title AS question_title
         FROM "Answer" a
         JOIN "Question" q ON a.question_id = q.id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC`,
        [userId]
      );

      // Follower and following counts
      const followCountsRes = await pool.query(
        `SELECT 
           (SELECT COUNT(*) FROM "UserFollow" WHERE following_id = $1) AS follower_count,
           (SELECT COUNT(*) FROM "UserFollow" WHERE follower_id = $1) AS following_count,
           (CASE WHEN $2::int IS NOT NULL THEN 
              EXISTS (SELECT 1 FROM "UserFollow" WHERE follower_id = $2 AND following_id = $1)
            ELSE false END) AS is_following`,
        [userId, currentUserId]
      );

      const followStats = followCountsRes.rows[0] || {
        follower_count: 0,
        following_count: 0,
        is_following: false,
      };

      return res.json({
        user: {
          ...user,
          follower_count: parseInt(followStats.follower_count, 10) || 0,
          following_count: parseInt(followStats.following_count, 10) || 0,
          is_following: Boolean(followStats.is_following),
        },
        questions: qRes.rows,
        answers: aRes.rows,
      });
    }

    // Memory fallback
    syncMemoryUserReputation(userId);

    const questions = memoryStore.questions.filter(q => (q.user_id || q.author_id) === userId);
    const answers = memoryStore.answers
      .filter(a => (a.user_id || a.author_id) === userId)
      .map(a => {
        const q = memoryStore.questions.find(x => x.id === a.question_id);
        return {
          ...a,
          question_title: q ? q.title : 'Question',
        };
      });

    const followerCount = (memoryStore.follows || []).filter(f => f.following_id === userId).length;
    const followingCount = (memoryStore.follows || []).filter(f => f.follower_id === userId).length;
    const isFollowing = currentUserId
      ? (memoryStore.follows || []).some(f => f.follower_id === currentUserId && f.following_id === userId)
      : false;

    const badges = await evaluateAndAwardBadges(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location || null,
        github_url: user.github_url || null,
        website_url: user.website_url || null,
        reputation_score: user.reputation_score,
        is_google_auth: Boolean(user.is_google_auth),
        auth_provider: user.auth_provider || 'local',
        is_email_verified: Boolean(user.is_email_verified),
        created_at: user.created_at,
        follower_count: followerCount,
        following_count: followingCount,
        is_following: isFollowing,
      },
      badges,
      questions,
      answers,
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// POST /api/users/:identifier/follow (Toggle Follow / Unfollow)
router.post('/:identifier/follow', requireAuth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const followerId = req.user.id;

    const targetUser = await resolveUser(identifier);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const followingId = targetUser.id;
    let isNowFollowing = false;

    if (isPostgresAvailable) {
      // Check existing follow
      const checkRes = await pool.query(
        'SELECT id FROM "UserFollow" WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );

      if (checkRes.rows.length > 0) {
        // Unfollow
        await pool.query(
          'DELETE FROM "UserFollow" WHERE follower_id = $1 AND following_id = $2',
          [followerId, followingId]
        );
        isNowFollowing = false;
      } else {
        // Follow
        await pool.query(
          'INSERT INTO "UserFollow" (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [followerId, followingId]
        );
        isNowFollowing = true;
      }

      // Query updated counts
      const countsRes = await pool.query(
        `SELECT 
           (SELECT COUNT(*) FROM "UserFollow" WHERE following_id = $1) AS follower_count,
           (SELECT COUNT(*) FROM "UserFollow" WHERE follower_id = $1) AS following_count`,
        [followingId]
      );

      if (isNowFollowing) {
        await createNotification({
          recipient_id: followingId,
          actor_id: followerId,
          type: 'follow',
          target_type: 'user',
          target_id: followingId,
          title: 'New follower',
          message: `${req.user.username} started following your profile`,
        });
        await evaluateAndAwardBadges(followingId);
      }

      return res.json({
        success: true,
        following: isNowFollowing,
        message: isNowFollowing ? `Now following @${targetUser.username}` : `Unfollowed @${targetUser.username}`,
        follower_count: parseInt(countsRes.rows[0].follower_count, 10) || 0,
        following_count: parseInt(countsRes.rows[0].following_count, 10) || 0,
      });
    }

    // Memory store fallback
    if (!memoryStore.follows) memoryStore.follows = [];
    const existingIndex = memoryStore.follows.findIndex(
      f => f.follower_id === followerId && f.following_id === followingId
    );

    if (existingIndex !== -1) {
      memoryStore.follows.splice(existingIndex, 1);
      isNowFollowing = false;
    } else {
      memoryStore.follows.push({
        id: Date.now(),
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date(),
      });
      isNowFollowing = true;

      createNotification({
        recipient_id: followingId,
        actor_id: followerId,
        type: 'follow',
        target_type: 'user',
        target_id: followingId,
        title: 'New follower',
        message: `${req.user.username} started following your profile`,
      });
      evaluateAndAwardBadges(followingId);
    }

    const followerCount = memoryStore.follows.filter(f => f.following_id === followingId).length;
    const followingCount = memoryStore.follows.filter(f => f.follower_id === followingId).length;

    return res.json({
      success: true,
      following: isNowFollowing,
      message: isNowFollowing ? `Now following @${targetUser.username}` : `Unfollowed @${targetUser.username}`,
      follower_count: followerCount,
      following_count: followingCount,
    });
  } catch (err) {
    console.error('Follow toggle error:', err);
    res.status(500).json({ error: 'Failed to update follow status' });
  }
});

// GET /api/users/:identifier/followers
router.get('/:identifier/followers', optionalAuth, async (req, res) => {
  try {
    let { identifier } = req.params;
    if (identifier === 'me' || identifier === 'profile') {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      identifier = String(req.user.id);
    }
    const user = await resolveUser(identifier);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (isPostgresAvailable) {
      const followersRes = await pool.query(
        `SELECT u.id, u.username, u.avatar_url, u.bio, u.reputation_score, uf.created_at AS followed_at
         FROM "UserFollow" uf
         JOIN "User" u ON uf.follower_id = u.id
         WHERE uf.following_id = $1
         ORDER BY uf.created_at DESC`,
        [user.id]
      );
      return res.json({ followers: followersRes.rows });
    }

    // Memory fallback
    const followerIds = (memoryStore.follows || [])
      .filter(f => f.following_id === user.id)
      .map(f => f.follower_id);

    const followers = memoryStore.users
      .filter(u => followerIds.includes(u.id))
      .map(u => ({
        id: u.id,
        username: u.username,
        avatar_url: u.avatar_url,
        bio: u.bio,
        reputation_score: u.reputation_score,
      }));

    res.json({ followers });
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ error: 'Failed to retrieve followers' });
  }
});

// GET /api/users/:identifier/following
router.get('/:identifier/following', optionalAuth, async (req, res) => {
  try {
    let { identifier } = req.params;
    if (identifier === 'me' || identifier === 'profile') {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      identifier = String(req.user.id);
    }
    const user = await resolveUser(identifier);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (isPostgresAvailable) {
      const followingRes = await pool.query(
        `SELECT u.id, u.username, u.avatar_url, u.bio, u.reputation_score, uf.created_at AS followed_at
         FROM "UserFollow" uf
         JOIN "User" u ON uf.following_id = u.id
         WHERE uf.follower_id = $1
         ORDER BY uf.created_at DESC`,
        [user.id]
      );
      return res.json({ following: followingRes.rows });
    }

    // Memory fallback
    const followingIds = (memoryStore.follows || [])
      .filter(f => f.follower_id === user.id)
      .map(f => f.following_id);

    const following = memoryStore.users
      .filter(u => followingIds.includes(u.id))
      .map(u => ({
        id: u.id,
        username: u.username,
        avatar_url: u.avatar_url,
        bio: u.bio,
        reputation_score: u.reputation_score,
      }));

    res.json({ following });
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ error: 'Failed to retrieve following list' });
  }
});

export default router;
