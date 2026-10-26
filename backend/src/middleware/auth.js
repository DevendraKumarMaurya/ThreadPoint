import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool, isPostgresAvailable, memoryStore } from '../lib/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'threadpoint_super_secret_jwt_key_2026_dev';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function resolveUserFromToken(token) {
  if (!token) return null;

  // Handle demo token (e.g. demo_jwt_token_carol_dba or demo_jwt_carol)
  if (token.startsWith('demo_jwt_token_') || token.startsWith('demo_jwt_')) {
    const rawUsername = token.replace(/^demo_jwt_token_|^demo_jwt_/, '');
    if (isPostgresAvailable) {
      try {
        const uRes = await pool.query(
          'SELECT id, username, email FROM "User" WHERE LOWER(username) = LOWER($1) OR LOWER(username) LIKE LOWER($2) LIMIT 1',
          [rawUsername, `${rawUsername}%`]
        );
        if (uRes.rows.length > 0) {
          const u = uRes.rows[0];
          return { id: u.id, username: u.username, email: u.email };
        }
      } catch (err) {
        console.error('Error resolving demo user from postgres:', err);
      }
    }

    const memUser = memoryStore.users.find(
      u => u.username.toLowerCase() === rawUsername.toLowerCase() ||
           u.username.toLowerCase().startsWith(rawUsername.toLowerCase())
    );
    if (memUser) {
      return { id: memUser.id, username: memUser.username, email: memUser.email };
    }
  }

  // Handle standard JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify the user referenced in the token still exists in the database.
    // This handles cases where the DB was re-initialized or the user was deleted
    // but the client still holds an old token (stale session).
    if (decoded && decoded.id) {
      if (isPostgresAvailable) {
        try {
          const res = await pool.query('SELECT id FROM "User" WHERE id = $1', [decoded.id]);
          if (res.rows.length === 0) {
            console.warn(`[Auth] JWT user id=${decoded.id} not found in DB — rejecting stale token`);
            return null;
          }
        } catch (dbErr) {
          // If the DB check itself fails, fall back to trusting the JWT
          console.warn('[Auth] DB user existence check failed, trusting JWT:', dbErr.message);
        }
      } else {
        // Memory store fallback
        const memUser = memoryStore.users.find(u => u.id === decoded.id);
        if (!memUser) {
          console.warn(`[Auth] JWT user id=${decoded.id} not found in memory store — rejecting stale token`);
          return null;
        }
      }
    }

    return decoded;
  } catch (err) {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing or invalid Authorization header with Bearer token',
    });
  }

  const token = authHeader.split(' ')[1];
  const user = await resolveUserFromToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Authentication token is invalid or expired',
      code: 'STALE_SESSION',
    });
  }

  req.user = user;
  next();
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  req.user = await resolveUserFromToken(token);
  next();
}
