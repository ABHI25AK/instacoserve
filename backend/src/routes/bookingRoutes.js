const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { findStandardMatch, findEmergencyMatch } = require('../services/matchingService');
const { processStandardPayment } = require('../services/paymentService');
const { notifyWorker, notifyCustomer } = require('../services/notificationService');
const { geocodeAddress } = require('../services/geoService');

/**
 * POST /api/bookings
 * Customer: Create a booking.
 * Runs matching engine (Emergency proximity-first vs Standard composite score),
 * assigns top matching verified worker, and creates booking record.
 */
router.post('/', authenticateToken, requireRole('customer'), async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const {
      category,
      mode = 'household',
      isEmergency = false,
      address,
      lat,
      lng,
      scheduledAt,
      price = 400.00,
      workerId
    } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Service category is required' });
    }

    // Resolve coordinates if missing but address provided
    let finalLat = lat != null ? parseFloat(lat) : null;
    let finalLng = lng != null ? parseFloat(lng) : null;
    let resolvedAddress = address || 'Central Delhi, India';

    if (finalLat == null || finalLng == null) {
      const geoResult = await geocodeAddress(resolvedAddress);
      finalLat = geoResult.lat;
      finalLng = geoResult.lng;
    }

    let assignedWorkerId = workerId ? parseInt(workerId, 10) : null;
    let matchedWorkerDetails = null;

    // Run matching engine if worker wasn't manually selected
    if (!assignedWorkerId) {
      const matches = isEmergency
        ? findEmergencyMatch(category, finalLat, finalLng)
        : findStandardMatch(category, finalLat, finalLng);

      if (matches.length > 0) {
        assignedWorkerId = matches[0].user_id;
        matchedWorkerDetails = matches[0];
      }
    } else {
      matchedWorkerDetails = db.prepare(`
        SELECT w.*, u.name as worker_name, u.phone as worker_phone
        FROM workers w
        JOIN users u ON u.id = w.user_id
        WHERE w.user_id = ?
      `).get(assignedWorkerId);
    }

    const bookingStatus = assignedWorkerId ? 'matched' : 'pending';

    const insertResult = db.prepare(`
      INSERT INTO bookings (
        customer_id, worker_id, category, mode, status,
        address, lat, lng, scheduled_at, price, is_emergency
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      assignedWorkerId,
      category,
      mode,
      bookingStatus,
      resolvedAddress,
      finalLat,
      finalLng,
      scheduledAt || new Date().toISOString(),
      price,
      isEmergency ? 1 : 0
    );

    const bookingId = insertResult.lastInsertRowid;

    // Send notifications
    if (assignedWorkerId) {
      await notifyWorker(
        assignedWorkerId,
        `New ${isEmergency ? 'EMERGENCY ' : ''}Booking #${bookingId} for ${category} at ${resolvedAddress}! Please accept or review your dashboard.`,
        isEmergency ? 'emergency_alert' : 'booking_assigned'
      );
    }

    await notifyCustomer(
      customerId,
      `Your booking #${bookingId} for ${category} has been placed. Worker: ${matchedWorkerDetails ? matchedWorkerDetails.worker_name : 'Matching in progress'}.`,
      'booking_confirmed'
    );

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId,
      status: bookingStatus,
      assignedWorker: matchedWorkerDetails || null,
      isEmergency: !!isEmergency
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bookings/mine
 * Customer or Worker: Get role-aware booking list with full details
 */
router.get('/mine', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = '';
    let params = [];

    if (role === 'customer') {
      query = `
        SELECT 
          b.*,
          w.skill_category as worker_skill,
          w.rating_avg as worker_rating,
          u_w.name as worker_name,
          u_w.phone as worker_phone,
          f.name as federation_name,
          p.status as payment_status,
          p.amount as paid_amount,
          r.stars as rating_stars,
          r.comment as rating_comment,
          d.status as dispute_status
        FROM bookings b
        LEFT JOIN workers w ON w.user_id = b.worker_id
        LEFT JOIN users u_w ON u_w.id = b.worker_id
        LEFT JOIN federations f ON f.id = w.federation_id
        LEFT JOIN payments p ON p.booking_id = b.id
        LEFT JOIN ratings r ON r.booking_id = b.id
        LEFT JOIN disputes d ON d.booking_id = b.id
        WHERE b.customer_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    } else if (role === 'worker') {
      query = `
        SELECT 
          b.*,
          u_c.name as customer_name,
          u_c.phone as customer_phone,
          p.status as payment_status,
          p.worker_payout,
          p.welfare_fund_cut,
          r.stars as rating_stars,
          r.comment as rating_comment
        FROM bookings b
        JOIN users u_c ON u_c.id = b.customer_id
        LEFT JOIN payments p ON p.booking_id = b.id
        LEFT JOIN ratings r ON r.booking_id = b.id
        WHERE b.worker_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    } else {
      return res.status(400).json({ error: 'Admins should use /api/admin endpoints' });
    }

    const bookings = db.prepare(query).all(...params);

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bookings/:id
 * Get single booking details with ownership check
 */
router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const role = req.user.role;

    const booking = db.prepare(`
      SELECT 
        b.*,
        u_c.name as customer_name,
        u_c.phone as customer_phone,
        u_c.email as customer_email,
        u_w.name as worker_name,
        u_w.phone as worker_phone,
        w.rating_avg as worker_rating,
        w.jobs_completed as worker_jobs_completed,
        f.name as federation_name,
        p.id as payment_id,
        p.amount as payment_amount,
        p.worker_payout,
        p.welfare_fund_cut,
        p.gateway_fee,
        p.status as payment_status,
        p.escrow_status,
        r.stars as rating_stars,
        r.comment as rating_comment,
        d.id as dispute_id,
        d.status as dispute_status,
        d.reason as dispute_reason
      FROM bookings b
      JOIN users u_c ON u_c.id = b.customer_id
      LEFT JOIN users u_w ON u_w.id = b.worker_id
      LEFT JOIN workers w ON w.user_id = b.worker_id
      LEFT JOIN federations f ON f.id = w.federation_id
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN ratings r ON r.booking_id = b.id
      LEFT JOIN disputes d ON d.booking_id = b.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Ownership check per TRD Section 3.1
    if (role === 'customer' && booking.customer_id !== userId) {
      return res.status(403).json({ error: 'Access denied to this booking' });
    }
    if (role === 'worker' && booking.worker_id !== userId) {
      return res.status(403).json({ error: 'Access denied to this booking' });
    }

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/bookings/:id/status
 * Customer/Worker: Move booking through lifecycle:
 * 'pending' -> 'matched' -> 'in_progress' -> 'completed' or 'cancelled'
 */
router.patch('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const validStatuses = ['pending', 'matched', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of [${validStatuses.join(', ')}]` });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Ownership checks
    if (role === 'customer' && booking.customer_id !== userId) {
      return res.status(403).json({ error: 'You can only update your own bookings' });
    }
    if (role === 'worker' && booking.worker_id !== userId) {
      return res.status(403).json({ error: 'You can only update bookings assigned to you' });
    }

    // Workers can accept ('matched'), start ('in_progress'), and complete ('completed')
    // Customers can cancel ('cancelled') if not already completed
    if (role === 'customer' && status !== 'cancelled') {
      return res.status(403).json({ error: 'Customers can only cancel bookings' });
    }

    db.prepare(`
      UPDATE bookings
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, bookingId);

    // If marked completed and payment doesn't exist yet, process automatic payment split
    if (status === 'completed') {
      const existingPayment = db.prepare('SELECT id FROM payments WHERE booking_id = ?').get(bookingId);
      if (!existingPayment && booking.price > 0 && booking.worker_id) {
        processStandardPayment(bookingId, booking.price);
      }
    }

    // Notifications
    if (role === 'worker') {
      await notifyCustomer(
        booking.customer_id,
        `Your booking #${bookingId} is now marked as "${status.replace('_', ' ').toUpperCase()}".`,
        'status_update'
      );
    } else if (role === 'customer' && booking.worker_id) {
      await notifyWorker(
        booking.worker_id,
        `Booking #${bookingId} was updated to "${status}" by customer.`,
        'status_update'
      );
    }

    res.json({
      message: `Booking status updated to ${status}`,
      bookingId,
      status
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bookings/:id/pay
 * Customer: Explicit payment trigger
 */
router.post('/:id/pay', authenticateToken, requireRole('customer'), async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const customerId = req.user.id;
    const { method = 'upi' } = req.body;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customer_id !== customerId) {
      return res.status(403).json({ error: 'Ownership check failed: You can only pay for your own booking' });
    }

    const existingPayment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(bookingId);
    if (existingPayment && existingPayment.status === 'paid') {
      return res.status(400).json({ error: 'Booking is already paid', payment: existingPayment });
    }

    const paymentResult = processStandardPayment(bookingId, booking.price, method);

    res.json({
      message: 'Payment completed successfully with zero intermediary commission split',
      ...paymentResult
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bookings/:id/rate
 * Customer: Rate & review completed booking.
 * Sub-3-star ratings require evidence_url or detailed comment.
 * Automatically recalculates worker's rating_avg.
 * If rating drops below 3.5, triggers review flag in worker_training_flags.
 */
router.post('/:id/rate', authenticateToken, requireRole('customer'), (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const customerId = req.user.id;
    const { stars, comment, evidenceUrl } = req.body;

    const numStars = parseInt(stars, 10);
    if (isNaN(numStars) || numStars < 1 || numStars > 5) {
      return res.status(400).json({ error: 'Rating stars must be an integer between 1 and 5' });
    }

    // Sub-3-star evidence check per PRD / TRD
    if (numStars < 3 && (!evidenceUrl && (!comment || comment.trim().length < 10))) {
      return res.status(400).json({
        error: 'Ratings below 3 stars require photo/evidence URL or an explanatory comment of at least 10 characters'
      });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customer_id !== customerId) {
      return res.status(403).json({ error: 'You can only rate bookings you requested' });
    }

    if (!booking.worker_id) {
      return res.status(400).json({ error: 'Cannot rate a booking without an assigned worker' });
    }

    const workerId = booking.worker_id;

    // Check if already rated
    const existing = db.prepare('SELECT id FROM ratings WHERE booking_id = ?').get(bookingId);
    if (existing) {
      return res.status(400).json({ error: 'Booking has already been rated' });
    }

    const rateTx = db.transaction(() => {
      // 1. Insert Rating
      db.prepare(`
        INSERT INTO ratings (booking_id, customer_id, worker_id, stars, comment, evidence_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(bookingId, customerId, workerId, numStars, comment || null, evidenceUrl || null);

      // 2. Recompute worker's rolling rating_avg
      const avgResult = db.prepare(`
        SELECT AVG(stars) as new_avg, COUNT(id) as total_ratings
        FROM ratings
        WHERE worker_id = ?
      `).get(workerId);

      const newAvg = Math.round((avgResult.new_avg || 5.0) * 10) / 10;

      db.prepare(`
        UPDATE workers
        SET rating_avg = ?
        WHERE user_id = ?
      `).run(newAvg, workerId);

      // 3. Welfare-Fund-Linked Training Flag if rating < 3.5 (PRD 6.5 / Schema 2.9)
      if (newAvg < 3.5) {
        const existingFlag = db.prepare(`
          SELECT id FROM worker_training_flags 
          WHERE worker_id = ? AND status = 'flagged'
        `).get(workerId);

        if (!existingFlag) {
          db.prepare(`
            INSERT INTO worker_training_flags (worker_id, reason, status)
            VALUES (?, ?, 'flagged')
          `).run(
            workerId,
            `Rolling average rating dropped to ${newAvg.toFixed(1)}/5.0. Upskilling training recommended.`
          );
        }
      }

      return newAvg;
    });

    const updatedAvg = rateTx();

    res.status(201).json({
      message: 'Rating recorded successfully',
      stars: numStars,
      workerNewRatingAvg: updatedAvg
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bookings/:id/dispute
 * Customer: Raise a dispute on a booking.
 * Freezes payments.escrow_status at 'disputed'.
 */
router.post('/:id/dispute', authenticateToken, requireRole('customer'), (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const customerId = req.user.id;
    const { reason, evidenceUrl } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'A specific reason for the dispute is required' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customer_id !== customerId) {
      return res.status(403).json({ error: 'You can only raise disputes on your own bookings' });
    }

    const disputeTx = db.transaction(() => {
      // 1. Insert dispute ticket
      const dispResult = db.prepare(`
        INSERT INTO disputes (booking_id, raised_by_user_id, reason, evidence_url, status)
        VALUES (?, ?, ?, ?, 'open')
      `).run(bookingId, customerId, reason, evidenceUrl || null);

      // 2. Freeze payment escrow_status to 'disputed'
      db.prepare(`
        UPDATE payments
        SET escrow_status = 'disputed'
        WHERE booking_id = ?
      `).run(bookingId);

      return dispResult.lastInsertRowid;
    });

    const disputeId = disputeTx();

    res.status(201).json({
      message: 'Dispute filed successfully. Payment has been held in escrow for federation review.',
      disputeId,
      status: 'open'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
