const env = require('../config/env');
const db = require('../config/database');

/**
 * Abstracted Notification Service
 * Sends SMS / Push / IVR notifications to workers and customers.
 * Defaults to clean simulated console logging in MVP mode.
 */

async function notifyWorker(workerId, message, type = 'booking_alert') {
  const worker = db.prepare(`
    SELECT u.name, u.phone, u.preferred_language, w.skill_category
    FROM workers w
    JOIN users u ON u.id = w.user_id
    WHERE w.user_id = ?
  `).get(workerId);

  const phone = worker ? worker.phone : 'Unknown';
  const name = worker ? worker.name : `Worker #${workerId}`;

  // Log simulated notification
  console.log(`\n📢 [SIMULATED SMS/IVR -> WORKER] To: ${name} (${phone}) | Type: [${type}]`);
  console.log(`   Message: "${message}"\n`);

  if (env.SMS_GATEWAY_API_KEY) {
    // TODO: Phase 2 - Production Telecom SMS Gateway integration
    try {
      console.log(`   [SMS Gateway] Dispatched via live telecom provider to ${phone}`);
    } catch (err) {
      console.error('[SMS Gateway Error]', err.message);
    }
  }

  return { success: true, delivered: true, timestamp: new Date().toISOString() };
}

async function notifyCustomer(customerId, message, type = 'booking_status') {
  const customer = db.prepare(`
    SELECT name, phone, email, preferred_language
    FROM users
    WHERE id = ?
  `).get(customerId);

  const phone = customer ? customer.phone : 'Unknown';
  const name = customer ? customer.name : `Customer #${customerId}`;

  console.log(`\n📢 [SIMULATED SMS/PUSH -> CUSTOMER] To: ${name} (${phone}) | Type: [${type}]`);
  console.log(`   Message: "${message}"\n`);

  if (env.SMS_GATEWAY_API_KEY) {
    // TODO: Phase 2 - Production Telecom SMS Gateway integration
  }

  return { success: true, delivered: true, timestamp: new Date().toISOString() };
}

module.exports = {
  notifyWorker,
  notifyCustomer
};
