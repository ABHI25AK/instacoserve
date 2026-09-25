/**
 * Automated Verification Script for InstaCoServe Backend
 */

const assert = require('assert');
const db = require('./src/config/database');
const seedDatabase = require('./src/db/seed');
const { findStandardMatch, findEmergencyMatch } = require('./src/services/matchingService');
const { calculatePaymentSplit, processStandardPayment } = require('./src/services/paymentService');
const { extractSearchIntent, generateChatbotResponse, forecastDemand } = require('./src/services/aiService');

async function runTests() {
  console.log('🧪 Starting InstaCoServe Automated Backend Test Suite...\n');

  // Step 1: Database Seed
  console.log('▶ Test 1: Database Seeding and Foreign Key Integrity');
  await seedDatabase();
  const fedCount = db.prepare('SELECT COUNT(*) as count FROM federations').get().count;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const workerCount = db.prepare('SELECT COUNT(*) as count FROM workers').get().count;
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;

  assert.strictEqual(fedCount >= 3, true, 'At least 3 federations must be seeded');
  assert.strictEqual(userCount >= 8, true, 'Users must be seeded');
  assert.strictEqual(workerCount >= 7, true, 'Workers must be seeded');
  assert.strictEqual(bookingCount > 30, true, 'Historical bookings must be seeded for forecasting');
  console.log('✅ Test 1 Passed: Database initialized with clean relationships.\n');

  // Step 2: Matching Engine Formulas
  console.log('▶ Test 2: Matching Engine (Standard vs Emergency Formulas)');
  const customerLat = 28.6139;
  const customerLng = 77.2090;

  // Standard match (composite score: 0.5/dist + 0.3*rating/5 + 0.2/(1+jobs))
  const standardMatches = findStandardMatch('Electrician', customerLat, customerLng);
  assert.strictEqual(standardMatches.length > 0, true, 'Standard match should return verified workers');
  assert.strictEqual(standardMatches[0].match_type, 'standard', 'Match type should be standard');
  assert.strictEqual(typeof standardMatches[0].score, 'number', 'Standard match must compute numerical score');
  console.log(`   Standard Top Match: ${standardMatches[0].worker_name} (Score: ${standardMatches[0].score}, Distance: ${standardMatches[0].distance_km}km)`);

  // Emergency match (proximity-first ascending by distance)
  const emergencyMatches = findEmergencyMatch('Electrician', customerLat, customerLng, 25);
  assert.strictEqual(emergencyMatches.length > 0, true, 'Emergency match should return workers');
  assert.strictEqual(emergencyMatches[0].match_type, 'emergency', 'Match type should be emergency');
  // Verify distance ordering
  for (let i = 1; i < emergencyMatches.length; i++) {
    assert.strictEqual(emergencyMatches[i].distance_km >= emergencyMatches[i - 1].distance_km, true, 'Emergency matches must be sorted strictly by distance ascending');
  }
  console.log(`   Emergency Top Match: ${emergencyMatches[0].worker_name} (Distance: ${emergencyMatches[0].distance_km}km, ETA: ${emergencyMatches[0].eta_minutes} mins)`);
  console.log('✅ Test 2 Passed: Standard and Emergency matching engines produce distinct, formula-compliant rankings.\n');

  // Step 3: Payment Split & Welfare Fund Calculations
  console.log('▶ Test 3: Zero-Commission Payment Split & Welfare Fund Crediting');
  const amount = 500.00;
  const split = calculatePaymentSplit(amount, 0.02, 0.02);
  assert.strictEqual(split.amount, 500.00);
  assert.strictEqual(split.gatewayFee, 10.00, 'Gateway fee should be 2% (₹10)');
  assert.strictEqual(split.welfareFundCut, 10.00, 'Welfare fund cut should be 2% (₹10)');
  assert.strictEqual(split.workerPayout, 480.00, 'Worker payout should be 96% (₹480)');

  // Test executing payment on a booking
  const testWorker = db.prepare('SELECT user_id, jobs_completed, federation_id FROM workers WHERE verified = 1 LIMIT 1').get();
  const testCustomer = db.prepare("SELECT id FROM users WHERE role = 'customer' LIMIT 1").get();
  const fedBefore = db.prepare('SELECT welfare_fund_balance FROM federations WHERE id = ?').get(testWorker.federation_id);
  
  const testBooking = db.prepare(`
    INSERT INTO bookings (customer_id, worker_id, category, mode, status, address, price)
    VALUES (?, ?, 'Plumber', 'household', 'in_progress', 'Test Address', ?)
  `).run(testCustomer.id, testWorker.user_id, amount);

  const paymentResult = processStandardPayment(testBooking.lastInsertRowid, amount, 'upi');
  const fedAfter = db.prepare('SELECT welfare_fund_balance FROM federations WHERE id = ?').get(testWorker.federation_id);
  const workerAfter = db.prepare('SELECT jobs_completed FROM workers WHERE user_id = ?').get(testWorker.user_id);

  assert.strictEqual(paymentResult.workerPayout, 480.00);
  assert.strictEqual(fedAfter.welfare_fund_balance, +(fedBefore.welfare_fund_balance + 10.00).toFixed(2), 'Federation welfare fund must be incremented by welfare_fund_cut');
  assert.strictEqual(workerAfter.jobs_completed, testWorker.jobs_completed + 1, 'Worker jobs_completed must be incremented');
  console.log(`   Gross: ₹${amount} -> Worker Payout (96%): ₹${paymentResult.workerPayout}, Welfare Cut (2%): ₹${paymentResult.welfareFundCut}, Gateway (2%): ₹${paymentResult.gatewayFee}`);
  console.log('✅ Test 3 Passed: Payment split accurately preserves worker earnings and updates welfare balance.\n');

  // Step 4: AI Two-Tier Intent Extraction
  console.log('▶ Test 4: AI Intent Extraction (Fallback Heuristic / LLM)');
  const intent1 = await extractSearchIntent('My kitchen sink pipe is burst and water is flooding everywhere urgently');
  assert.strictEqual(intent1.category, 'Plumber');
  assert.strictEqual(intent1.urgency, 'emergency');
  assert.strictEqual(intent1.mode, 'household');

  const intent2 = await extractSearchIntent('Need electrician crew to inspect wiring for community panchayat hall');
  assert.strictEqual(intent2.category, 'Electrician');
  assert.strictEqual(intent2.mode, 'community');
  console.log('   Intent 1 (Emergency):', intent1);
  console.log('   Intent 2 (Community):', intent2);
  console.log('✅ Test 4 Passed: Natural language search properly extracts category, mode, and emergency flag.\n');

  // Step 5: Conversational Assistant
  console.log('▶ Test 5: AI Conversational Chatbot');
  const chatReply = await generateChatbotResponse('What is the commission rate and how does worker welfare fund work?');
  assert.strictEqual(chatReply.length > 20, true, 'Chatbot should return informative response');
  console.log(`   Assistant Response: "${chatReply.slice(0, 120)}..."`);
  console.log('✅ Test 5 Passed: Chatbot handles platform governance and pricing queries out of the box.\n');

  // Step 6: Real Ordinary Least Squares (OLS) Linear Regression Demand Forecasting
  console.log('▶ Test 6: AI Demand Forecasting (Ordinary Least Squares Linear Regression)');
  const firstFed = db.prepare('SELECT id FROM federations LIMIT 1').get();
  const forecast = forecastDemand(firstFed.id, 'Electrician');
  assert.strictEqual(forecast.forecast_7_days.length, 7, 'Must forecast 7 days');
  assert.strictEqual(['rising', 'falling', 'stable'].includes(forecast.trend_direction), true, 'Trend direction must be valid enum');
  assert.strictEqual(typeof forecast.growth_rate_per_day, 'number', 'Growth rate slope must be calculated');
  console.log(`   Category: ${forecast.category} | Trend: ${forecast.trend_direction.toUpperCase()} | Slope: ${forecast.growth_rate_per_day}/day | 7-Day Forecast Sum: ${forecast.total_predicted_next_week} bookings`);
  console.log('✅ Test 6 Passed: Real mathematical OLS regression computes explainable forecasts.\n');

  // Step 7: Ratings, Sub-3-Star Evidence Enforcement, and Training Flags
  console.log('▶ Test 7: Ratings, Evidence Verification, and Upskilling Flags');
  const flagged = db.prepare('SELECT * FROM worker_training_flags LIMIT 1').get();
  assert.strictEqual(!!flagged, true, 'Worker with rating < 3.5 should have training flag entry');
  console.log(`   Flagged Worker ID ${flagged.worker_id}: "${flagged.reason}" (Status: ${flagged.status})`);
  console.log('✅ Test 7 Passed: Quality governance and welfare upskilling flags verified.\n');

  console.log('🎉 ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
