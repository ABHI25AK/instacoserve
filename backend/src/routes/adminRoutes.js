const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { forecastDemand } = require('../services/aiService');

// Require admin authentication for all routes in this file
router.use(authenticateToken, requireRole('admin'));

/**
 * GET /api/admin/overview
 * Returns federation summary metrics:
 * Worker counts, booking statistics, welfare balance, and revenue totals.
 */
router.get('/overview', (req, res, next) => {
  try {
    const federationId = req.user.federation_id;

    const federation = db.prepare(`
      SELECT * FROM federations WHERE id = ?
    `).get(federationId);

    if (!federation) {
      return res.status(404).json({ error: 'Federation record not found' });
    }

    // 1. Worker metrics
    const workerStats = db.prepare(`
      SELECT 
        COUNT(*) as total_workers,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_workers,
        SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as pending_workers,
        SUM(CASE WHEN available = 1 AND verified = 1 THEN 1 ELSE 0 END) as online_workers
      FROM workers
      WHERE federation_id = ?
    `).get(federationId);

    // 2. Booking metrics
    const bookingStats = db.prepare(`
      SELECT 
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN date(b.created_at) = date('now') THEN 1 ELSE 0 END) as bookings_today,
        SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN b.status IN ('matched', 'in_progress') THEN 1 ELSE 0 END) as active_bookings,
        SUM(CASE WHEN b.is_emergency = 1 THEN 1 ELSE 0 END) as emergency_bookings
      FROM bookings b
      JOIN workers w ON w.user_id = b.worker_id
      WHERE w.federation_id = ?
    `).get(federationId);

    // 3. Financial & Welfare metrics
    const financialStats = db.prepare(`
      SELECT 
        COALESCE(SUM(p.amount), 0) as total_gross_volume,
        COALESCE(SUM(p.worker_payout), 0) as total_worker_earnings,
        COALESCE(SUM(p.welfare_fund_cut), 0) as total_welfare_collected
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN workers w ON w.user_id = b.worker_id
      WHERE w.federation_id = ? AND p.status = 'paid'
    `).get(federationId);

    // 4. Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT 
        b.category,
        COUNT(b.id) as count,
        COALESCE(SUM(b.price), 0) as volume
      FROM bookings b
      JOIN workers w ON w.user_id = b.worker_id
      WHERE w.federation_id = ?
      GROUP BY b.category
      ORDER BY count DESC
    `).all(federationId);

    // 5. Open disputes count
    const openDisputes = db.prepare(`
      SELECT COUNT(d.id) as open_dispute_count
      FROM disputes d
      JOIN bookings b ON b.id = d.booking_id
      JOIN workers w ON w.user_id = b.worker_id
      WHERE w.federation_id = ? AND d.status = 'open'
    `).get(federationId);

    res.json({
      federation,
      workers: workerStats,
      bookings: bookingStats,
      finance: financialStats,
      categories: categoryBreakdown,
      openDisputesCount: openDisputes ? openDisputes.open_dispute_count : 0
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/forecast
 * Computes AI Demand Forecast (OLS linear regression) per category
 */
router.get('/forecast', (req, res, next) => {
  try {
    const federationId = req.user.federation_id;
    const { category } = req.query;

    const categories = category
      ? [category]
      : ['Electrician', 'Plumber', 'Carpenter', 'Domestic Help', 'Caregiver', 'Painter'];

    const forecasts = categories.map((cat) => forecastDemand(federationId, cat));

    res.json({
      federation_id: federationId,
      forecasts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/disputes
 * List all disputes routed to this federation
 */
router.get('/disputes', (req, res, next) => {
  try {
    const federationId = req.user.federation_id;
    const { status } = req.query;

    let query = `
      SELECT 
        d.*,
        b.category,
        b.address,
        b.price,
        u_c.name as customer_name,
        u_c.phone as customer_phone,
        u_w.name as worker_name,
        u_w.phone as worker_phone,
        p.amount as payment_amount,
        p.escrow_status,
        r.stars as rating_stars
      FROM disputes d
      JOIN bookings b ON b.id = d.booking_id
      JOIN users u_c ON u_c.id = d.raised_by_user_id
      JOIN workers w ON w.user_id = b.worker_id
      JOIN users u_w ON u_w.id = b.worker_id
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN ratings r ON r.booking_id = b.id
      WHERE w.federation_id = ?
    `;

    const params = [federationId];

    if (status) {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY d.created_at DESC`;

    const disputes = db.prepare(query).all(...params);

    res.json({ disputes });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/disputes/:id/resolve
 * Admin: Adjudicate dispute and unfreeze/refund escrow
 */
router.patch('/disputes/:id/resolve', (req, res, next) => {
  try {
    const disputeId = parseInt(req.params.id, 10);
    const adminId = req.user.id;
    const federationId = req.user.federation_id;
    const { resolutionNote, action = 'release_to_worker' } = req.body; // 'release_to_worker' or 'refund_customer'

    if (!resolutionNote) {
      return res.status(400).json({ error: 'Resolution notes are required' });
    }

    const dispute = db.prepare(`
      SELECT d.*, b.id as booking_id, w.federation_id
      FROM disputes d
      JOIN bookings b ON b.id = d.booking_id
      JOIN workers w ON w.user_id = b.worker_id
      WHERE d.id = ?
    `).get(disputeId);

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute case not found' });
    }

    if (dispute.federation_id !== federationId) {
      return res.status(403).json({ error: 'Dispute is outside your federation governance scope' });
    }

    const resolveTx = db.transaction(() => {
      // 1. Mark dispute as resolved
      db.prepare(`
        UPDATE disputes
        SET status = 'resolved',
            resolved_by_user_id = ?,
            resolution_note = ?,
            resolved_at = datetime('now')
        WHERE id = ?
      `).run(adminId, resolutionNote, disputeId);

      // 2. Adjust payment escrow status
      const newEscrowStatus = action === 'refund_customer' ? 'released' : 'released';
      const newPaymentStatus = action === 'refund_customer' ? 'refunded' : 'paid';

      db.prepare(`
        UPDATE payments
        SET escrow_status = ?, status = ?
        WHERE booking_id = ?
      `).run(newEscrowStatus, newPaymentStatus, dispute.booking_id);
    });

    resolveTx();

    res.json({
      message: 'Dispute adjudicated and logged successfully',
      disputeId,
      status: 'resolved',
      action
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/welfare-fund
 * Detailed ledger of welfare fund balance and recent contributions
 */
router.get('/welfare-fund', (req, res, next) => {
  try {
    const federationId = req.user.federation_id;

    const federation = db.prepare('SELECT id, name, welfare_fund_balance FROM federations WHERE id = ?').get(federationId);

    const contributions = db.prepare(`
      SELECT 
        p.id as payment_id,
        p.welfare_fund_cut,
        p.amount as gross_booking_value,
        p.created_at,
        b.id as booking_id,
        b.category,
        u_w.name as worker_name
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN workers w ON w.user_id = b.worker_id
      JOIN users u_w ON u_w.id = b.worker_id
      WHERE w.federation_id = ? AND p.status = 'paid'
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all(federationId);

    res.json({
      federation,
      contributions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/training-flags
 * View workers flagged for training/review
 */
router.get('/training-flags', (req, res, next) => {
  try {
    const federationId = req.user.federation_id;

    const flags = db.prepare(`
      SELECT 
        tf.*,
        u.name as worker_name,
        u.phone as worker_phone,
        w.skill_category,
        w.rating_avg,
        w.jobs_completed
      FROM worker_training_flags tf
      JOIN users u ON u.id = tf.worker_id
      JOIN workers w ON w.user_id = tf.worker_id
      WHERE w.federation_id = ?
      ORDER BY tf.created_at DESC
    `).all(federationId);

    res.json({ flags });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
