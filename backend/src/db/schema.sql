-- SahakarSeva / InstaCoServe Database Schema
-- Compatible with SQLite (local development) and PostgreSQL (production)

-- 1. Federations
CREATE TABLE IF NOT EXISTS federations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT,
    readiness_score INTEGER DEFAULT 50,
    welfare_fund_balance NUMERIC(12,2) DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'worker', 'admin')),
    federation_id INTEGER REFERENCES federations(id),
    preferred_language TEXT DEFAULT 'en',
    created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Workers
CREATE TABLE IF NOT EXISTS workers (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    federation_id INTEGER NOT NULL REFERENCES federations(id),
    skill_category TEXT NOT NULL,
    verified BOOLEAN DEFAULT 0,
    rating_avg NUMERIC(2,1) DEFAULT 5.0,
    jobs_completed INTEGER DEFAULT 0,
    lat REAL,
    lng REAL,
    available BOOLEAN DEFAULT 1,
    daily_subscription_paid_through TEXT
);

-- 4. Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES users(id),
    worker_id INTEGER REFERENCES users(id),
    category TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('household', 'community')) DEFAULT 'household',
    status TEXT NOT NULL CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    address TEXT,
    lat REAL,
    lng REAL,
    scheduled_at TEXT,
    price NUMERIC(10,2),
    is_emergency BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. Institutional Contracts (Phase 2 scaffold)
CREATE TABLE IF NOT EXISTS institutional_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('inspection', 'quote_approval', 'milestone_signoff', 'staged_release')) DEFAULT 'inspection',
    quote_amount NUMERIC(12,2),
    assigned_crew_note TEXT,
    approved_by_user_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 6. Payments
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    amount NUMERIC(10,2) NOT NULL,
    worker_payout NUMERIC(10,2) NOT NULL,
    welfare_fund_cut NUMERIC(10,2) NOT NULL,
    gateway_fee NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'refunded', 'held')) DEFAULT 'paid',
    escrow_status TEXT CHECK (escrow_status IN ('n/a', 'held', 'released', 'disputed')) DEFAULT 'n/a',
    dispute_deadline TEXT,
    method TEXT DEFAULT 'upi',
    created_at TEXT DEFAULT (datetime('now'))
);

-- 7. Ratings
CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    customer_id INTEGER NOT NULL REFERENCES users(id),
    worker_id INTEGER NOT NULL REFERENCES users(id),
    stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment TEXT,
    evidence_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 8. Disputes
CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    raised_by_user_id INTEGER NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('open', 'under_review', 'resolved')) DEFAULT 'open',
    resolved_by_user_id INTEGER REFERENCES users(id),
    resolution_note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- 9. Worker Training Flags
CREATE TABLE IF NOT EXISTS worker_training_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('flagged', 'training_assigned', 'reviewed', 'cleared')) DEFAULT 'flagged',
    created_at TEXT DEFAULT (datetime('now'))
);

-- 10. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'bot')),
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 11. Demand Forecast Cache
CREATE TABLE IF NOT EXISTS demand_forecast_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    federation_id INTEGER NOT NULL REFERENCES federations(id),
    category TEXT NOT NULL,
    forecast_date TEXT NOT NULL,
    predicted_bookings NUMERIC(6,2),
    trend_direction TEXT CHECK (trend_direction IN ('rising', 'falling', 'stable')),
    generated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performant lookups
CREATE INDEX IF NOT EXISTS idx_workers_federation ON workers(federation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_category_date ON bookings(category, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_worker ON ratings(worker_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
