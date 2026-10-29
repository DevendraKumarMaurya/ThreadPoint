import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma, pool, isPostgresAvailable, memoryStore } from '../lib/db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { sendOtpEmail } from '../lib/mailer.js';

const router = express.Router();

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  return new OAuth2Client(clientId);
}

// Helper to format user response safely
function formatUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatar_url: u.avatar_url,
    bio: u.bio,
    reputation_score: u.reputation_score,
    is_google_auth: Boolean(u.is_google_auth),
    auth_provider: u.auth_provider || (u.password_hash ? 'local' : 'google'),
    is_email_verified: Boolean(u.is_email_verified),
    created_at: u.created_at,
  };
}

// -----------------------------------------------------------------------------
// POST /api/auth/google - Authenticate via Google OAuth 2.0 (GIS ID Token)
// -----------------------------------------------------------------------------
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    let payload;

    // Check for developer testing mock token
    if (typeof credential === 'string' && credential.startsWith('dev-mock-google-token:')) {
      try {
        const raw = credential.replace('dev-mock-google-token:', '');
        const parsed = JSON.parse(decodeURIComponent(raw));
        payload = {
          sub: parsed.sub || `google_dev_${Date.now()}`,
          email: parsed.email,
          name: parsed.name || 'Google User',
          picture: parsed.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${parsed.email}`,
          email_verified: true,
        };
      } catch (err) {
        return res.status(400).json({ error: 'Invalid mock Google token payload' });
      }
    } else {
      // Cryptographically verify Google ID Token using official Google Client
      const googleClient = getGoogleClient();
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const ticketPayload = ticket.getPayload();
      payload = {
        sub: ticketPayload.sub,
        email: ticketPayload.email,
        name: ticketPayload.name,
        picture: ticketPayload.picture,
        email_verified: ticketPayload.email_verified,
      };
    }

    const { sub: google_id, email, name, picture, email_verified } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Unable to retrieve email from Google profile' });
    }

    let user;

    if (isPostgresAvailable) {
      // 1. Check if user exists by google_id or email
      user = await prisma.user.findFirst({
        where: {
          OR: [{ google_id }, { email }],
        },
      });

      if (!user) {
        // Create unique username from email prefix
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        let uniqueUsername = baseUsername;
        let count = 1;
        while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
          uniqueUsername = `${baseUsername}_${count++}`;
        }

        user = await prisma.user.create({
          data: {
            username: uniqueUsername,
            email,
            password_hash: null, // No password initially for pure Google OAuth users
            avatar_url: picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${uniqueUsername}`,
            bio: 'ThreadPoint contributor joined via Google.',
            is_google_auth: true,
            auth_provider: 'google',
            google_id,
            is_email_verified: Boolean(email_verified),
            reputation_score: 1,
          },
        });
      } else {
        // Link Google ID to existing account if not yet attached
        const updates = {};
        if (!user.google_id) {
          updates.google_id = google_id;
          updates.is_google_auth = true;
          updates.auth_provider = user.password_hash ? 'both' : 'google';
        }
        if (!user.is_email_verified && email_verified) {
          updates.is_email_verified = true;
        }
        if (picture) {
          updates.avatar_url = picture;
        }

        if (Object.keys(updates).length > 0) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updates,
          });
        }
      }
    } else {
      // Memory Store Fallback
      user = memoryStore.users.find(u => u.google_id === google_id || u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        let uniqueUsername = baseUsername;
        let count = 1;
        while (memoryStore.users.some(u => u.username === uniqueUsername)) {
          uniqueUsername = `${baseUsername}_${count++}`;
        }

        const newId = memoryStore.users.length > 0 ? Math.max(...memoryStore.users.map(u => u.id)) + 1 : 1;
        user = {
          id: newId,
          username: uniqueUsername,
          email,
          password_hash: null,
          avatar_url: picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${uniqueUsername}`,
          bio: 'ThreadPoint contributor joined via Google.',
          reputation_score: 1,
          is_google_auth: true,
          auth_provider: 'google',
          google_id,
          is_email_verified: Boolean(email_verified),
          created_at: new Date(),
        };
        memoryStore.users.push(user);
      } else {
        user.is_google_auth = true;
        user.google_id = google_id;
        user.auth_provider = user.password_hash ? 'both' : 'google';
        user.is_email_verified = true;
        if (picture) {
          user.avatar_url = picture;
        }
      }
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    return res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(401).json({ error: 'Failed to authenticate with Google: ' + (err.message || 'Invalid token') });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/register - Standard email + password registration with OTP dispatch
// -----------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, bio, avatar_url } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    let user;

    if (isPostgresAvailable) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      user = await prisma.user.create({
        data: {
          username,
          email,
          password_hash: hashedPassword,
          bio: bio || 'Community member & contributor.',
          avatar_url: defaultAvatar,
          reputation_score: 1,
          is_google_auth: false,
          auth_provider: 'local',
          is_email_verified: false,
        },
      });
    } else {
      const exists = memoryStore.users.some(u => u.username === username || u.email === email);
      if (exists) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      const newId = memoryStore.users.length > 0 ? Math.max(...memoryStore.users.map(u => u.id)) + 1 : 1;
      user = {
        id: newId,
        username,
        email,
        password_hash: hashedPassword,
        avatar_url: defaultAvatar,
        bio: bio || 'Community member & contributor.',
        reputation_score: 1,
        is_google_auth: false,
        auth_provider: 'local',
        google_id: null,
        is_email_verified: false,
        created_at: new Date(),
      };
      memoryStore.users.push(user);
    }

    // Generate 6-digit OTP code for initial email verification
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (isPostgresAvailable) {
      await prisma.emailOtp.deleteMany({
        where: { email, purpose: 'email_verification' },
      });
      await prisma.emailOtp.create({
        data: {
          email,
          otp_hash: otpHash,
          purpose: 'email_verification',
          expires_at: expiresAt,
        },
      });
    } else {
      memoryStore.otps = memoryStore.otps.filter(o => !(o.email === email && o.purpose === 'email_verification'));
      memoryStore.otps.push({
        id: Date.now(),
        email,
        otp_hash: otpHash,
        purpose: 'email_verification',
        attempts: 0,
        expires_at: expiresAt,
        created_at: new Date(),
      });
    }

    // Dispatch email
    await sendOtpEmail({ to: email, otp: otpCode, purpose: 'email_verification' });

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    return res.status(201).json({
      token,
      user: formatUser(user),
      message: 'Registration successful. A 6-digit verification code was sent to your email.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/login - Password Authentication with Google-Only guidance
// -----------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required' });
    }

    let user;

    if (isPostgresAvailable) {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
        },
      });
    } else {
      user = memoryStore.users.find(
        u => u.email === emailOrUsername || u.username === emailOrUsername
      );
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If account was created strictly with Google and user hasn't set a password yet:
    if (!user.password_hash) {
      return res.status(400).json({
        error: 'This account was registered using Google. Please click "Continue with Google" to sign in, or set a password in your account settings.',
        is_google_only: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/send-otp - Generate and dispatch 6-digit OTP
// -----------------------------------------------------------------------------
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'email_verification' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const validPurposes = ['email_verification', 'password_reset', 'login'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({ error: 'Invalid OTP purpose' });
    }

    // Cooldown check (60-second throttling)
    const now = new Date();
    const cooldownThreshold = new Date(now.getTime() - 60 * 1000);

    let recentOtp;
    if (isPostgresAvailable) {
      recentOtp = await prisma.emailOtp.findFirst({
        where: {
          email,
          purpose,
          created_at: { gt: cooldownThreshold },
        },
      });
    } else {
      recentOtp = memoryStore.otps.find(
        o => o.email === email && o.purpose === purpose && o.created_at > cooldownThreshold
      );
    }

    if (recentOtp) {
      const secondsRemaining = Math.max(
        1,
        60 - Math.floor((now.getTime() - new Date(recentOtp.created_at).getTime()) / 1000)
      );
      return res.status(429).json({
        error: `Please wait ${secondsRemaining}s before requesting a new verification code.`,
        retry_after: secondsRemaining,
      });
    }

    // Generate cryptographically random 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 8);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    if (isPostgresAvailable) {
      // Clean up previous OTPs for this email and purpose
      await prisma.emailOtp.deleteMany({
        where: { email, purpose },
      });
      await prisma.emailOtp.create({
        data: {
          email,
          otp_hash: otpHash,
          purpose,
          attempts: 0,
          expires_at: expiresAt,
        },
      });
    } else {
      memoryStore.otps = memoryStore.otps.filter(o => !(o.email === email && o.purpose === purpose));
      memoryStore.otps.push({
        id: Date.now(),
        email,
        otp_hash: otpHash,
        purpose,
        attempts: 0,
        expires_at: expiresAt,
        created_at: now,
      });
    }

    await sendOtpEmail({ to: email, otp: otpCode, purpose });

    return res.json({
      message: 'Verification code sent to your email address.',
      expires_in_minutes: 10,
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to dispatch verification code' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/resend-otp - Resend code (wrapper around send-otp)
// -----------------------------------------------------------------------------
router.post('/resend-otp', async (req, res) => {
  // Identical behaviour to send-otp — implemented inline to avoid router.handle() (not public API)
  const { email, purpose = 'email_verification' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  const validPurposes = ['email_verification', 'password_reset', 'login'];
  if (!validPurposes.includes(purpose)) {
    return res.status(400).json({ error: 'Invalid OTP purpose' });
  }

  const now = new Date();
  const cooldownThreshold = new Date(now.getTime() - 60 * 1000);

  try {
    let recentOtp;
    if (isPostgresAvailable) {
      recentOtp = await prisma.emailOtp.findFirst({
        where: { email, purpose, created_at: { gt: cooldownThreshold } },
      });
    } else {
      recentOtp = memoryStore.otps.find(
        o => o.email === email && o.purpose === purpose && o.created_at > cooldownThreshold
      );
    }

    if (recentOtp) {
      const secondsRemaining = Math.max(
        1,
        60 - Math.floor((now.getTime() - new Date(recentOtp.created_at).getTime()) / 1000)
      );
      return res.status(429).json({
        error: `Please wait ${secondsRemaining}s before requesting a new verification code.`,
        retry_after: secondsRemaining,
      });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 8);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    if (isPostgresAvailable) {
      await prisma.emailOtp.deleteMany({ where: { email, purpose } });
      await prisma.emailOtp.create({
        data: { email, otp_hash: otpHash, purpose, attempts: 0, expires_at: expiresAt },
      });
    } else {
      memoryStore.otps = memoryStore.otps.filter(o => !(o.email === email && o.purpose === purpose));
      memoryStore.otps.push({
        id: Date.now(), email, otp_hash: otpHash, purpose, attempts: 0,
        expires_at: expiresAt, created_at: now,
      });
    }

    await sendOtpEmail({ to: email, otp: otpCode, purpose });

    return res.json({
      message: 'Verification code resent to your email address.',
      expires_in_minutes: 10,
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/verify-otp - Verify 6-digit code & verify user email
// -----------------------------------------------------------------------------
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'email_verification' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const cleanOtp = String(otp).trim();
    const now = new Date();

    let record;
    if (isPostgresAvailable) {
      record = await prisma.emailOtp.findFirst({
        where: {
          email,
          purpose,
          expires_at: { gt: now },
        },
        orderBy: { created_at: 'desc' },
      });
    } else {
      record = memoryStore.otps.find(
        o => o.email === email && o.purpose === purpose && o.expires_at > now
      );
    }

    if (!record) {
      return res.status(400).json({ error: 'Verification code has expired or does not exist. Please request a new code.' });
    }

    // Check failed attempts limit (max 5)
    if (record.attempts >= 5) {
      if (isPostgresAvailable) {
        await prisma.emailOtp.delete({ where: { id: record.id } });
      } else {
        memoryStore.otps = memoryStore.otps.filter(o => o.id !== record.id);
      }
      return res.status(429).json({
        error: 'Maximum verification attempts exceeded. Please request a fresh code.',
      });
    }

    // Increment attempts count
    if (isPostgresAvailable) {
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
    } else {
      record.attempts += 1;
    }

    // Compare bcrypt hash of OTP code
    const isValid = await bcrypt.compare(cleanOtp, record.otp_hash);
    if (!isValid) {
      const remaining = 5 - (record.attempts + 1);
      return res.status(400).json({
        error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code will be invalidated.'}`,
      });
    }

    // Code is valid! Delete used OTP record
    if (isPostgresAvailable) {
      await prisma.emailOtp.delete({ where: { id: record.id } });
    } else {
      memoryStore.otps = memoryStore.otps.filter(o => o.id !== record.id);
    }

    // Update user's email verification status
    let updatedUser;
    if (isPostgresAvailable) {
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        updatedUser = await prisma.user.update({
          where: { email },
          data: { is_email_verified: true },
        });
      }
    } else {
      const userExists = memoryStore.users.find(u => u.email === email);
      if (userExists) {
        userExists.is_email_verified = true;
        updatedUser = userExists;
      }
    }

    return res.json({
      success: true,
      message: 'Email verified successfully!',
      is_email_verified: true,
      user: updatedUser ? formatUser(updatedUser) : null,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Internal server error verifying code' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/set-password - Authenticated: Add or update password for user
// -----------------------------------------------------------------------------
router.post('/set-password', requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let updatedUser;

    if (isPostgresAvailable) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Determine new auth_provider: 'both' if user had google_id, otherwise 'local'
      const newProvider = user.google_id ? 'both' : 'local';

      updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          password_hash: hashedPassword,
          auth_provider: newProvider,
        },
      });
    } else {
      const user = memoryStore.users.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.password_hash = hashedPassword;
      user.auth_provider = user.google_id ? 'both' : 'local';
      updatedUser = user;
    }

    return res.json({
      success: true,
      message: 'Password configured successfully. You can now log in using your password or Google.',
      user: formatUser(updatedUser),
    });
  } catch (err) {
    console.error('Set password error:', err);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/auth/me - Current user session info
// -----------------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res) => {
  try {
    let user;
    if (isPostgresAvailable) {
      user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });
    } else {
      user = memoryStore.users.find(u => u.id === req.user.id);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: formatUser(user) });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Internal server error fetching session' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/demo-switch - Switch active persona
// -----------------------------------------------------------------------------
router.post('/demo-switch', async (req, res) => {
  try {
    const { id, username } = req.body;
    let user;

    if (isPostgresAvailable) {
      if (id) {
        user = await prisma.user.findUnique({
          where: { id: parseInt(id, 10) },
        });
      } else if (username) {
        user = await prisma.user.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
        });
      }
    } else {
      user = memoryStore.users.find(
        u => (id && u.id === parseInt(id, 10)) || (username && u.username.toLowerCase() === username.toLowerCase())
      );
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Demo switch error:', err);
    res.status(500).json({ error: 'Failed to switch demo user' });
  }
});

export default router;
