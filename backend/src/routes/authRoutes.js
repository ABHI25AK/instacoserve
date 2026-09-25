const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const env = require('../config/env');
const { authenticateToken } = require('../middleware/auth');

/**
 * Public: Get list of federations for registration dropdown
 */
router.get('/federations', (req, res, next) => {
  try {
    const federations = db.prepare(`
      SELECT id, name, state, district, readiness_score, welfare_fund_balance
      FROM federations
      ORDER BY name ASC
    `).all();
    res.json({ federations });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/register
 * Self-registration for Customer and Worker roles.
 * Workers require federation_id and skill_category; account created with verified = false.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password, role, federationId, skillCategory, preferredLanguage, lat, lng } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['customer', 'worker'].includes(role)) {
      return res.status(400).json({ error: 'Self-registration allowed only for customer or worker roles' });
    }

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    if (role === 'worker') {
      if (!federationId || !skillCategory) {
        return res.status(400).json({ error: 'Federation and skill category are required for worker registration' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createUserTx = db.transaction(() => {
      // 1. Insert User
      const userResult = db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, federation_id, preferred_language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        name,
        email.toLowerCase(),
        phone || null,
        passwordHash,
        role,
        role === 'worker' ? federationId : null,
        preferredLanguage || 'en'
      );

      const userId = userResult.lastInsertRowid;

      // 2. If worker, create worker record (verified = 0 by default)
      if (role === 'worker') {
        db.prepare(`
          INSERT INTO workers (user_id, federation_id, skill_category, verified, rating_avg, jobs_completed, lat, lng, available)
          VALUES (?, ?, ?, 0, 5.0, 0, ?, ?, 1)
        `).run(
          userId,
          federationId,
          skillCategory,
          lat != null ? parseFloat(lat) : 28.6139,
          lng != null ? parseFloat(lng) : 77.2090
        );
      }

      return userId;
    });

    const userId = createUserTx();

    // Issue JWT
    const token = jwt.sign(
      { id: userId, role, federationId: role === 'worker' ? federationId : null },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: role === 'worker' 
        ? 'Worker registration submitted! Your account is pending verification by the federation admin.'
        : 'Registration successful!',
      token,
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
        phone,
        role,
        federation_id: role === 'worker' ? federationId : null,
        preferred_language: preferredLanguage || 'en',
        verified: role === 'worker' ? false : true
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Standard login for all 3 roles (Customer, Worker, Admin).
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare(`
      SELECT u.*, f.name as federation_name 
      FROM users u
      LEFT JOIN federations f ON f.id = u.federation_id
      WHERE LOWER(u.email) = LOWER(?)
    `).get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let workerProfile = null;
    if (user.role === 'worker') {
      workerProfile = db.prepare(`
        SELECT * FROM workers WHERE user_id = ?
      `).get(user.id);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, federationId: user.federation_id },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        federation_id: user.federation_id,
        federation_name: user.federation_name,
        preferred_language: user.preferred_language,
        workerProfile: workerProfile || undefined
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Authenticated: Return current user session details
 */
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    let workerProfile = null;
    if (req.user.role === 'worker') {
      workerProfile = db.prepare(`
        SELECT w.*, f.name as federation_name 
        FROM workers w
        JOIN federations f ON f.id = w.federation_id
        WHERE w.user_id = ?
      `).get(req.user.id);
    }

    let federation = null;
    if (req.user.federation_id) {
      federation = db.prepare('SELECT * FROM federations WHERE id = ?').get(req.user.federation_id);
    }

    res.json({
      user: {
        ...req.user,
        workerProfile,
        federation
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
