import express from 'express';
import { pool, isPostgresAvailable, memoryStore, evaluateAndAwardBadges } from '../lib/db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to resolve user ID by identifier
async function resolveUserId(identifier) {
  const isNumeric = /^\d+$/.test(String(identifier).trim());
  const clean = String(identifier).trim();

  if (isPostgresAvailable) {
    if (isNumeric) {
      const res = await pool.query('SELECT id FROM "User" WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(email) = LOWER($2)', [parseInt(clean, 10), clean]);
      return res.rows[0]?.id || null;
    }
    const res = await pool.query('SELECT id FROM "User" WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)', [clean]);
    return res.rows[0]?.id || null;
  }

  if (isNumeric) {
    const u = memoryStore.users.find(u => u.id === parseInt(clean, 10) || u.username.toLowerCase() === clean.toLowerCase() || u.email?.toLowerCase() === clean.toLowerCase());
    return u?.id || null;
  }
  const u = memoryStore.users.find(u => u.username.toLowerCase() === clean.toLowerCase() || u.email?.toLowerCase() === clean.toLowerCase());
  return u?.id || null;
}

// GET /api/badges - Get all available badges with recipient counts
router.get('/', async (req, res) => {
  try {
    if (isPostgresAvailable) {
      const result = await pool.query(`
        SELECT b.id, b.name, b.description, b.icon, b.tier,
               COUNT(ub.user_id)::int AS recipient_count
        FROM "Badge" b
        LEFT JOIN "UserBadge" ub ON b.id = ub.badge_id
        GROUP BY b.id, b.name, b.description, b.icon, b.tier
        ORDER BY 
          CASE b.tier 
            WHEN 'gold' THEN 1 
            WHEN 'silver' THEN 2 
            WHEN 'bronze' THEN 3 
            ELSE 4 
          END,
          b.name ASC
      `);
      return res.json({ badges: result.rows });
    }

    // Memory fallback
    const badges = (memoryStore.badges || []).map(b => {
      const count = (memoryStore.userBadges || []).filter(ub => ub.badge_id === b.id).length;
      return {
        ...b,
        recipient_count: count,
      };
    });

    res.json({ badges });
  } catch (err) {
    console.error('Fetch badges error:', err);
    res.status(500).json({ error: 'Failed to retrieve badges' });
  }
});

// GET /api/badges/user/:identifier - Get badges earned by user
router.get('/user/:identifier', optionalAuth, async (req, res) => {
  try {
    let { identifier } = req.params;
    if (identifier === 'me' || identifier === 'profile') {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      identifier = String(req.user.id);
    }
    const userId = await resolveUserId(identifier);
    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const badges = await evaluateAndAwardBadges(userId);
    res.json({ badges });
  } catch (err) {
    console.error('Fetch user badges error:', err);
    res.status(500).json({ error: 'Failed to retrieve user badges' });
  }
});

export default router;
