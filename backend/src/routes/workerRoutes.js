const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/workers
 * Admin: List & filter workers within the admin's federation
 */
router.get('/', authenticateToken, requireRole('admin'), (req, res, next) => {
  try {
    const federationId = req.user.federation_id;
    const { status, skill } = req.query;

    let query = `
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.preferred_language,
        u.created_at as registered_at,
        w.skill_category,
        w.verified,
        w.rating_avg,
        w.jobs_completed,
        w.available,
        w.lat,
        w.lng,
        w.daily_subscription_paid_through,
        (
          SELECT status 
          FROM worker_training_flags tf 
          WHERE tf.worker_id = u.id AND tf.status = 'flagged' 
          LIMIT 1
        ) as training_flag
      FROM users u
      JOIN workers w ON w.user_id = u.id
      WHERE w.federation_id = ?
    `;

    const params = [federationId];

    if (status === 'pending') {
      query += ` AND w.verified = 0`;
    } else if (status === 'verified') {
      query += ` AND w.verified = 1`;
    }

    if (skill) {
      query += ` AND LOWER(w.skill_category) = LOWER(?)`;
      params.push(skill);
    }

    query += ` ORDER BY w.verified ASC, u.created_at DESC`;

    const workers = db.prepare(query).all(...params);

    res.json({ workers });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/workers/:userId/verify
 * Admin: Verify or reject a worker in their federation
 */
router.patch('/:userId/verify', authenticateToken, requireRole('admin'), (req, res, next) => {
  try {
    const federationId = req.user.federation_id;
    const targetUserId = parseInt(req.params.userId, 10);
    const { verified } = req.body; // boolean: true or false

    const worker = db.prepare(`
      SELECT * FROM workers WHERE user_id = ? AND federation_id = ?
    `).get(targetUserId, federationId);

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found in your federation' });
    }

    db.prepare(`
      UPDATE workers
      SET verified = ?
      WHERE user_id = ?
    `).run(verified ? 1 : 0, targetUserId);

    res.json({
      message: verified ? 'Worker approved and verified successfully' : 'Worker status set to unverified',
      workerId: targetUserId,
      verified: !!verified
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/workers/me/availability
 * Worker: Toggle own availability & update live location coordinates
 */
router.patch('/me/availability', authenticateToken, requireRole('worker'), (req, res, next) => {
  try {
    const workerId = req.user.id;
    const { available, lat, lng } = req.body;

    let updateFields = [];
    let params = [];

    if (available !== undefined) {
      updateFields.push('available = ?');
      params.push(available ? 1 : 0);
    }

    if (lat != null && lng != null) {
      updateFields.push('lat = ?', 'lng = ?');
      params.push(parseFloat(lat), parseFloat(lng));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No update parameters provided' });
    }

    params.push(workerId);

    db.prepare(`
      UPDATE workers
      SET ${updateFields.join(', ')}
      WHERE user_id = ?
    `).run(...params);

    const updated = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(workerId);

    res.json({
      message: 'Worker status updated',
      worker: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/workers/me/earnings
 * Worker: View personal payout history, welfare contributions, and subscription
 */
router.get('/me/earnings', authenticateToken, requireRole('worker'), (req, res, next) => {
  try {
    const workerId = req.user.id;

    const worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(workerId);
    
    // Total earned
    const summary = db.prepare(`
      SELECT 
        COALESCE(SUM(p.worker_payout), 0) as total_earned,
        COALESCE(SUM(p.welfare_fund_cut), 0) as total_welfare_contributed,
        COUNT(p.id) as paid_jobs_count
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE b.worker_id = ? AND p.status = 'paid'
    `).get(workerId);

    // List of recent payouts
    const payouts = db.prepare(`
      SELECT 
        p.id as payment_id,
        p.amount as gross_amount,
        p.worker_payout,
        p.welfare_fund_cut,
        p.gateway_fee,
        p.created_at as paid_at,
        b.id as booking_id,
        b.category,
        b.address,
        u.name as customer_name
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN users u ON u.id = b.customer_id
      WHERE b.worker_id = ? AND p.status = 'paid'
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(workerId);

    res.json({
      worker,
      summary,
      payouts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/workers/me/subscription
 * Worker: Pay small flat daily subscription fee (zero-commission model)
 */
router.post('/me/subscription', authenticateToken, requireRole('worker'), (req, res, next) => {
  try {
    const workerId = req.user.id;
    const { days = 1 } = req.body; // e.g. 1 day = ₹20 flat fee

    const now = Date.now();
    const currentWorker = db.prepare('SELECT daily_subscription_paid_through FROM workers WHERE user_id = ?').get(workerId);
    
    let baseTime = now;
    if (currentWorker && currentWorker.daily_subscription_paid_through) {
      const currentExpiry = new Date(currentWorker.daily_subscription_paid_through).getTime();
      if (currentExpiry > now) {
        baseTime = currentExpiry;
      }
    }

    const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE workers
      SET daily_subscription_paid_through = ?
      WHERE user_id = ?
    `).run(newExpiry, workerId);

    res.json({
      message: `Flat daily subscription activated for ${days} day(s)`,
      subscription_paid_through: newExpiry,
      daily_fee: 20 * days
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/workers/bulk-import
 * Admin: Bulk onboard worker roster from array of member records (PRD 6.8)
 */
router.post('/bulk-import', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const federationId = req.user.federation_id;
    const { workers } = req.body; // Array of { name, email, phone, skillCategory, lat, lng }

    if (!Array.isArray(workers) || workers.length === 0) {
      return res.status(400).json({ error: 'Array of worker objects is required' });
    }

    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const results = [];

    const importTx = db.transaction(() => {
      for (const w of workers) {
        if (!w.name || !w.email || !w.skillCategory) {
          continue;
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(w.email.toLowerCase());
        if (existing) {
          results.push({ email: w.email, status: 'skipped (already exists)' });
          continue;
        }

        const userRes = db.prepare(`
          INSERT INTO users (name, email, phone, password_hash, role, federation_id, preferred_language)
          VALUES (?, ?, ?, ?, 'worker', ?, ?)
        `).run(
          w.name,
          w.email.toLowerCase(),
          w.phone || null,
          defaultPasswordHash,
          federationId,
          w.preferredLanguage || 'hi'
        );

        const newUserId = userRes.lastInsertRowid;

        db.prepare(`
          INSERT INTO workers (user_id, federation_id, skill_category, verified, rating_avg, jobs_completed, lat, lng, available)
          VALUES (?, ?, ?, 1, 5.0, 0, ?, ?, 1)
        `).run(
          newUserId,
          federationId,
          w.skillCategory,
          w.lat != null ? parseFloat(w.lat) : 28.6139,
          w.lng != null ? parseFloat(w.lng) : 77.2090
        );

        results.push({ email: w.email, userId: newUserId, status: 'imported and verified' });
      }
    });

    importTx();

    res.json({
      message: `Bulk import completed: ${results.filter(r => r.userId).length} worker(s) registered`,
      results
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
