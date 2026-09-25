const bcrypt = require('bcryptjs');
const db = require('../config/database');
const initDb = require('./initDb');

async function seedDatabase() {
  console.log('Seeding database with realistic cooperative data...');
  
  // Initialize schema first
  await initDb();

  // Clear existing records in proper dependency order
  db.exec(`
    DELETE FROM demand_forecast_cache;
    DELETE FROM chat_messages;
    DELETE FROM worker_training_flags;
    DELETE FROM disputes;
    DELETE FROM ratings;
    DELETE FROM payments;
    DELETE FROM institutional_contracts;
    DELETE FROM bookings;
    DELETE FROM workers;
    DELETE FROM users;
    DELETE FROM federations;
  `);

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Seed Federations
  const insertFed = db.prepare(`
    INSERT INTO federations (name, state, district, readiness_score, welfare_fund_balance)
    VALUES (?, ?, ?, ?, ?)
  `);

  const fed1 = insertFed.run('Delhi Shramik Sahakari Federation', 'Delhi', 'Central Delhi', 88, 14250.00).lastInsertRowid;
  const fed2 = insertFed.run('Maharashtra Labour Cooperative Federation', 'Maharashtra', 'Mumbai Suburban', 92, 28400.00).lastInsertRowid;
  const fed3 = insertFed.run('Karnataka Nirman Sahakara Sangha', 'Karnataka', 'Bengaluru Urban', 79, 9800.00).lastInsertRowid;

  // 2. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, federation_id, preferred_language)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Admins
  const admin1Id = insertUser.run('Rajesh Sharma (Admin)', 'admin@delhicoop.org', '9811001100', passwordHash, 'admin', fed1, 'hi').lastInsertRowid;
  const admin2Id = insertUser.run('Pooja Patil (Admin)', 'admin@mahacoop.org', '9822002200', passwordHash, 'admin', fed2, 'en').lastInsertRowid;

  // Customers
  const cust1Id = insertUser.run('Aarav Mehta', 'customer@gmail.com', '9876543210', passwordHash, 'customer', null, 'en').lastInsertRowid;
  const cust2Id = insertUser.run('Priya Nair', 'priya@gmail.com', '9876543211', passwordHash, 'customer', null, 'hi').lastInsertRowid;

  // Workers
  const w1User = insertUser.run('Ramesh Kumar', 'ramesh.electrician@gmail.com', '9810112233', passwordHash, 'worker', fed1, 'hi').lastInsertRowid;
  const w2User = insertUser.run('Suresh Gupta', 'suresh.plumber@gmail.com', '9810112234', passwordHash, 'worker', fed1, 'hi').lastInsertRowid;
  const w3User = insertUser.run('Vikram Singh', 'vikram.carpenter@gmail.com', '9810112235', passwordHash, 'worker', fed1, 'en').lastInsertRowid;
  const w4User = insertUser.run('Sunita Devi', 'sunita.domestic@gmail.com', '9810112236', passwordHash, 'worker', fed1, 'hi').lastInsertRowid;
  const w5User = insertUser.run('Anita Rao', 'anita.caregiver@gmail.com', '9810112237', passwordHash, 'worker', fed1, 'en').lastInsertRowid;
  const w6User = insertUser.run('Manoj Verma', 'manoj.painter@gmail.com', '9810112238', passwordHash, 'worker', fed1, 'hi').lastInsertRowid;
  const w7User = insertUser.run('Ganesh Kadam', 'ganesh.electric@gmail.com', '9820112239', passwordHash, 'worker', fed2, 'mr').lastInsertRowid;
  const w8User = insertUser.run('Karan Johal', 'karan.plumber@gmail.com', '9810112240', passwordHash, 'worker', fed1, 'hi').lastInsertRowid;

  // 3. Seed Workers Table
  const insertWorker = db.prepare(`
    INSERT INTO workers (user_id, federation_id, skill_category, verified, rating_avg, jobs_completed, lat, lng, available, daily_subscription_paid_through)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  insertWorker.run(w1User, fed1, 'Electrician', 1, 4.8, 42, 28.6139, 77.2090, 1, tomorrow);
  insertWorker.run(w2User, fed1, 'Plumber', 1, 4.9, 55, 28.6200, 77.2150, 1, tomorrow);
  insertWorker.run(w3User, fed1, 'Carpenter', 1, 4.6, 28, 28.6300, 77.2200, 1, tomorrow);
  insertWorker.run(w4User, fed1, 'Domestic Help', 0, 5.0, 0, 28.6100, 77.2000, 1, null); // Pending verification
  insertWorker.run(w5User, fed1, 'Caregiver', 1, 4.7, 31, 28.6050, 77.2250, 1, tomorrow);
  insertWorker.run(w6User, fed1, 'Painter', 1, 4.5, 19, 28.6250, 77.2050, 1, tomorrow);
  insertWorker.run(w7User, fed2, 'Electrician', 1, 4.9, 64, 19.0760, 72.8777, 1, tomorrow);
  insertWorker.run(w8User, fed1, 'Plumber', 1, 3.2, 12, 28.6400, 77.2300, 1, tomorrow);

  // Worker 8 training flag
  db.prepare(`
    INSERT INTO worker_training_flags (worker_id, reason, status)
    VALUES (?, ?, ?)
  `).run(w8User, 'Rolling average rating dropped below 3.5 (current: 3.2). Upskilling module recommended.', 'flagged');

  // 4. Seed Historical Bookings (past 30 days) to give real historical data for linear regression forecasting
  const insertBooking = db.prepare(`
    INSERT INTO bookings (customer_id, worker_id, category, mode, status, address, lat, lng, scheduled_at, price, is_emergency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (booking_id, amount, worker_payout, welfare_fund_cut, gateway_fee, status, escrow_status, method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const categories = ['Electrician', 'Plumber', 'Carpenter', 'Domestic Help', 'Caregiver', 'Painter'];
  const workerMap = {
    'Electrician': w1User,
    'Plumber': w2User,
    'Carpenter': w3User,
    'Domestic Help': w4User,
    'Caregiver': w5User,
    'Painter': w6User
  };

  // Generate past 30 days bookings with steady/rising trend
  const now = new Date();
  for (let i = 30; i >= 1; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString();
    
    categories.forEach((cat, idx) => {
      const count = Math.floor(1 + (30 - i) * 0.1 + (idx % 2));
      for (let k = 0; k < count; k++) {
        const price = 350 + (idx * 50);
        const gatewayFee = +(price * 0.02).toFixed(2);
        const welfareCut = +(price * 0.02).toFixed(2);
        const workerPayout = +(price - gatewayFee - welfareCut).toFixed(2);
        
        const bResult = insertBooking.run(
          cust1Id,
          workerMap[cat] || w1User,
          cat,
          'household',
          'completed',
          `Connaught Place Block ${String.fromCharCode(65 + k)}, New Delhi`,
          28.6315,
          77.2167,
          dateStr,
          price,
          k === 0 && idx === 0 ? 1 : 0,
          dateStr,
          dateStr
        );
        
        insertPayment.run(
          bResult.lastInsertRowid,
          price,
          workerPayout,
          welfareCut,
          gatewayFee,
          'paid',
          'n/a',
          'upi',
          dateStr
        );
      }
    });
  }

  // 5. Seed Active / Pending / In-Progress Bookings for demo
  const bActive = insertBooking.run(
    cust1Id,
    w1User,
    'Electrician',
    'household',
    'in_progress',
    'Flat 402, Sector 14, RK Puram, New Delhi',
    28.5672,
    77.1741,
    new Date().toISOString(),
    450.00,
    1,
    new Date().toISOString(),
    new Date().toISOString()
  ).lastInsertRowid;

  insertPayment.run(bActive, 450.00, 432.00, 9.00, 9.00, 'paid', 'n/a', 'upi', new Date().toISOString());

  const bMatched = insertBooking.run(
    cust2Id,
    w2User,
    'Plumber',
    'household',
    'matched',
    'House 12, Lajpat Nagar III, New Delhi',
    28.5700,
    77.2400,
    new Date().toISOString(),
    350.00,
    0,
    new Date().toISOString(),
    new Date().toISOString()
  ).lastInsertRowid;

  insertPayment.run(bMatched, 350.00, 336.00, 7.00, 7.00, 'paid', 'n/a', 'upi', new Date().toISOString());

  // 6. Seed a Rating and a Dispute
  const bCompleted = insertBooking.run(
    cust1Id,
    w3User,
    'Carpenter',
    'household',
    'completed',
    'B-104, Saket, New Delhi',
    28.5245,
    77.2066,
    new Date(Date.now() - 86400000).toISOString(),
    600.00,
    0,
    new Date(Date.now() - 86400000).toISOString(),
    new Date(Date.now() - 86400000).toISOString()
  ).lastInsertRowid;

  insertPayment.run(bCompleted, 600.00, 576.00, 12.00, 12.00, 'paid', 'n/a', 'upi', new Date(Date.now() - 86400000).toISOString());

  db.prepare(`
    INSERT INTO ratings (booking_id, customer_id, worker_id, stars, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(bCompleted, cust1Id, w3User, 5, 'Superb wooden shelf repair, very polite and on time!', new Date(Date.now() - 86400000).toISOString());

  // Dispute case
  const bDisputed = insertBooking.run(
    cust2Id,
    w8User,
    'Plumber',
    'household',
    'completed',
    'Pocket C, Mayur Vihar, New Delhi',
    28.6080,
    77.2950,
    new Date(Date.now() - 172800000).toISOString(),
    400.00,
    0,
    new Date(Date.now() - 172800000).toISOString(),
    new Date(Date.now() - 172800000).toISOString()
  ).lastInsertRowid;

  insertPayment.run(bDisputed, 400.00, 384.00, 8.00, 8.00, 'held', 'disputed', 'upi', new Date(Date.now() - 172800000).toISOString());

  db.prepare(`
    INSERT INTO ratings (booking_id, customer_id, worker_id, stars, comment, evidence_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(bDisputed, cust2Id, w8User, 2, 'Pipe still leaking after fixing, water pooling under sink.', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400', new Date(Date.now() - 172800000).toISOString());

  db.prepare(`
    INSERT INTO disputes (booking_id, raised_by_user_id, reason, evidence_url, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(bDisputed, cust2Id, 'Pipe joint was not sealed properly, still leaking water.', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400', 'open', new Date(Date.now() - 172800000).toISOString());

  console.log('Database seeded successfully!');
  console.log('Test Accounts:');
  console.log(' - Customer: customer@gmail.com / password123');
  console.log(' - Worker: ramesh.electrician@gmail.com / password123');
  console.log(' - Admin: admin@delhicoop.org / password123');
  return true;
}

if (require.main === module) {
  seedDatabase().catch(err => console.error('Seed error:', err));
}

module.exports = seedDatabase;
