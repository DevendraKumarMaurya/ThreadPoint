import express from 'express';
import { pool, isPostgresAvailable, memoryStore } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Get current user notifications and unread count
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isPostgresAvailable) {
      const notifsRes = await pool.query(
        `SELECT n.id, n.recipient_id, n.actor_id, n.type, n.target_type, n.target_id,
                n.title, n.message, n.is_read, n.created_at,
                u.username AS actor_username, u.avatar_url AS actor_avatar
         FROM "Notification" n
         LEFT JOIN "User" u ON n.actor_id = u.id
         WHERE n.recipient_id = $1
         ORDER BY n.created_at DESC
         LIMIT 40`,
        [userId]
      );

      const unreadRes = await pool.query(
        'SELECT COUNT(*)::int AS unread_count FROM "Notification" WHERE recipient_id = $1 AND is_read = false',
        [userId]
      );

      return res.json({
        notifications: notifsRes.rows,
        unread_count: unreadRes.rows[0]?.unread_count || 0,
      });
    }

    // Memory store fallback
    const userNotifs = (memoryStore.notifications || [])
      .filter(n => n.recipient_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(n => {
        const actor = memoryStore.users.find(u => u.id === n.actor_id);
        return {
          ...n,
          actor_username: actor ? actor.username : 'User',
          actor_avatar: actor ? actor.avatar_url : null,
        };
      });

    const unreadCount = userNotifs.filter(n => !n.is_read).length;

    res.json({
      notifications: userNotifs.slice(0, 40),
      unread_count: unreadCount,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// PATCH /api/notifications/read-all - Mark all user notifications as read
// IMPORTANT: Must be registered BEFORE /:id/read to prevent 'read-all' matching as :id param
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isPostgresAvailable) {
      await pool.query(
        'UPDATE "Notification" SET is_read = true WHERE recipient_id = $1 AND is_read = false',
        [userId]
      );
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    // Memory fallback
    (memoryStore.notifications || [])
      .filter(n => n.recipient_id === userId)
      .forEach(n => {
        n.is_read = true;
      });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(notifId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    if (isPostgresAvailable) {
      const result = await pool.query(
        'UPDATE "Notification" SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING id, is_read',
        [notifId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.json({ success: true, notification: result.rows[0] });
    }

    // Memory fallback
    const notif = (memoryStore.notifications || []).find(n => n.id === notifId && n.recipient_id === userId);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notif.is_read = true;
    res.json({ success: true, notification: notif });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
