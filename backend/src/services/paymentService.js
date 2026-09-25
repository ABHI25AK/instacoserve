const db = require('../config/database');

/**
 * Calculates payout splits for a service booking amount:
 * workerPayout = amount - gatewayFee (2%) - welfareFundCut (2%)
 */
function calculatePaymentSplit(amount, gatewayRate = 0.02, welfareRate = 0.02) {
  const numAmount = parseFloat(amount) || 0;
  const gatewayFee = +(numAmount * gatewayRate).toFixed(2);
  const welfareFundCut = +(numAmount * welfareRate).toFixed(2);
  const workerPayout = +(numAmount - gatewayFee - welfareFundCut).toFixed(2);

  return {
    amount: numAmount,
    gatewayFee,
    welfareFundCut,
    workerPayout
  };
}

/**
 * Process a completed booking payment:
 * 1. Insert payment record with split calculation
 * 2. Credit worker's federation welfare_fund_balance
 * 3. Increment worker's jobs_completed count
 */
function processStandardPayment(bookingId, amount, method = 'upi') {
  const booking = db.prepare(`
    SELECT b.*, w.federation_id 
    FROM bookings b
    JOIN workers w ON w.user_id = b.worker_id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking) {
    throw new Error('Booking or assigned worker not found');
  }

  const { gatewayFee, welfareFundCut, workerPayout } = calculatePaymentSplit(amount);

  // Use SQLite transaction for atomicity
  const executePaymentTx = db.transaction(() => {
    // 1. Insert Payment
    const paymentResult = db.prepare(`
      INSERT INTO payments (
        booking_id, amount, worker_payout, welfare_fund_cut, 
        gateway_fee, status, escrow_status, method
      )
      VALUES (?, ?, ?, ?, ?, 'paid', 'n/a', ?)
    `).run(
      bookingId,
      amount,
      workerPayout,
      welfareFundCut,
      gatewayFee,
      method
    );

    // 2. Credit Federation Welfare Fund Balance
    db.prepare(`
      UPDATE federations
      SET welfare_fund_balance = welfare_fund_balance + ?
      WHERE id = ?
    `).run(welfareFundCut, booking.federation_id);

    // 3. Increment Worker Jobs Completed
    db.prepare(`
      UPDATE workers
      SET jobs_completed = jobs_completed + 1
      WHERE user_id = ?
    `).run(booking.worker_id);

    return paymentResult.lastInsertRowid;
  });

  const paymentId = executePaymentTx();

  return {
    paymentId,
    bookingId,
    amount,
    workerPayout,
    welfareFundCut,
    gatewayFee,
    status: 'paid',
    message: 'Payment processed successfully and welfare fund credited'
  };
}

/**
 * Phase 2 Institutional Escrow Stubs:
 */
function holdInstitutionalEscrow(bookingId, amount) {
  const { gatewayFee, welfareFundCut, workerPayout } = calculatePaymentSplit(amount);

  const disputeDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const payment = db.prepare(`
    INSERT INTO payments (
      booking_id, amount, worker_payout, welfare_fund_cut,
      gateway_fee, status, escrow_status, dispute_deadline, method
    )
    VALUES (?, ?, ?, ?, ?, 'held', 'held', ?, 'upi_escrow')
  `).run(bookingId, amount, workerPayout, welfareFundCut, gatewayFee, disputeDeadline);

  return {
    paymentId: payment.lastInsertRowid,
    escrowStatus: 'held',
    disputeDeadline
  };
}

function releaseInstitutionalEscrow(bookingId) {
  const payment = db.prepare(`
    SELECT p.*, w.federation_id, b.worker_id
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    JOIN workers w ON w.user_id = b.worker_id
    WHERE p.booking_id = ?
  `).get(bookingId);

  if (!payment) {
    throw new Error('Payment record not found for escrow release');
  }

  const releaseTx = db.transaction(() => {
    db.prepare(`
      UPDATE payments
      SET status = 'paid', escrow_status = 'released'
      WHERE id = ?
    `).run(payment.id);

    db.prepare(`
      UPDATE federations
      SET welfare_fund_balance = welfare_fund_balance + ?
      WHERE id = ?
    `).run(payment.welfare_fund_cut, payment.federation_id);

    db.prepare(`
      UPDATE workers
      SET jobs_completed = jobs_completed + 1
      WHERE user_id = ?
    `).run(payment.worker_id);
  });

  releaseTx();

  return { success: true, status: 'released' };
}

module.exports = {
  calculatePaymentSplit,
  processStandardPayment,
  holdInstitutionalEscrow,
  releaseInstitutionalEscrow
};
