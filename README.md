# InstaCoServe (SahakarSeva) — Cooperative Gig Services Platform
**Problem Statement SIH26089 | Ministry of Cooperation | Smart India Hackathon 2026**

InstaCoServe is a cooperative-owned digital gig services platform that connects verified Labour Cooperative Federation workers directly to households and community institutions without commission extraction. 

---

## Key Highlights & Architecture

1. **Zero Commission Extraction (Bharat Taxi Model for Gig Work)**
   - **96%** of every customer service payment goes directly to the verified cooperative worker.
   - **2%** automatically credits the Federation Worker Welfare & Social Security Fund (healthcare, accident coverage, upskilling).
   - **2%** covers payment gateway transaction fees.
   - Workers pay a flat daily subscription (₹20/day) rather than 20–30% per-job commissions.

2. **Dual-Mode Matching Engine**
   - **Standard Matching Formula:** Composite ranking based on $w_1 \cdot \text{distance}^{-1} + w_2 \cdot (\text{rating} / 5) + w_3 \cdot (1 / (1 + \text{active\_jobs}))$.
   - **Emergency Matching Formula:** Strict proximity-first ascending distance ranking within a tight 5–10 km radius for urgent household hazards (sparking wiring, water bursts).
   - **Community / Institutional Mode:** Direct routing to Federation Admin for skill-matrix crew assignment for panchayats and schools.

3. **Zero-Key Out-Of-The-Box Reliability**
   - Runs 100% locally with zero paid API keys or external services using pure WASM SQLite, OpenStreetMap Nominatim geocoding, rule-based AI intent and chatbot fallbacks, and real OLS linear regression forecasting.
   - Automatically upgrades to live LLM or Google Maps if API keys are provided in `.env`.

4. **Explainable AI Demand Forecasting**
   - Real Ordinary Least Squares (OLS) Linear Regression ($\hat{y} = \alpha + \beta x$) over historical daily booking counts.
   - Predicts 7-day future volume and trend directions (`Rising`, `Falling`, `Stable`) with plain-language guidance for federation planners.

5. **Cooperative Quality Governance**
   - Sub-3-star ratings require photo evidence or detailed reasoning.
   - Workers with rolling ratings below 3.5 are flagged for federation welfare-funded upskilling (supportive intervention, not silent deactivation).
   - Disputes freeze payments in escrow until adjudicated by the local Federation Admin.

6. **Bilingual Accessibility**
   - Full English and Hindi (`en` / `hi`) support with accessible UI (color + text status badges, >= 44px tap targets).

---

## Directory Structure

```
instacoserve/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Pure WASM SQLite with auto-save
│   │   │   └── env.js               # Environment config
│   │   ├── db/
│   │   │   ├── schema.sql           # Schema with CHECK constraints & indexes
│   │   │   ├── initDb.js            # DB Table initialization
│   │   │   └── seed.js              # Seed with 3 Federations, Workers, Bookings
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT auth & RBAC middleware
│   │   │   └── errorHandler.js      # Centralized error handler
│   │   ├── services/
│   │   │   ├── geoService.js        # OSM Nominatim & Haversine distance
│   │   │   ├── matchingService.js   # Standard & Emergency matching engines
│   │   │   ├── paymentService.js    # 96% worker / 2% welfare / 2% gateway split
│   │   │   ├── aiService.js         # Intent extraction, Chatbot & OLS forecasting
│   │   │   └── notificationService.js # Abstracted SMS / IVR notification interface
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # /api/auth
│   │   │   ├── workerRoutes.js      # /api/workers
│   │   │   ├── bookingRoutes.js     # /api/bookings
│   │   │   ├── adminRoutes.js       # /api/admin
│   │   │   └── aiRoutes.js          # /api/ai
│   │   └── server.js                # Express app entry point
│   ├── test-api.js                  # Automated verification test suite
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, BookingCard, StatCard, ChatbotWidget, etc.
│   │   ├── context/                 # AuthContext & LanguageContext
│   │   ├── i18n/                    # English & Hindi translation tables
│   │   ├── pages/
│   │   │   ├── customer/            # CustomerDashboard, BookingFlow, MyBookings
│   │   │   ├── worker/              # WorkerDashboard, EarningsPage
│   │   │   ├── admin/               # AdminOverview, WorkerManagement, Forecast, Disputes, Welfare
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── services/api.js          # Axios API client
│   │   ├── styles/index.css         # Brand colors & typography
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Quick Start & Run Instructions

### 1. Start the Backend
```bash
cd backend
npm install
npm run seed      # Seeds federations, workers, 30 days of historical data, active jobs
npm start         # Starts backend on http://localhost:5000
```

To run the automated backend test suite:
```bash
npm test          # Runs node test-api.js (validates all formulas, auth, matching, and DB)
```

### 2. Start the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev       # Starts React + Vite on http://localhost:3000
```

---

## Demo Credentials (Included in Seed)

| Role | Email | Password | Scope / Features |
|---|---|---|---|
| **Customer** | `customer@gmail.com` | `password123` | NLP search, household/community booking, emergency dispatch, ratings, disputes |
| **Worker** | `ramesh.electrician@gmail.com` | `password123` | Availability toggle, accept/start/complete jobs, 96% payout ledger, ₹20 daily subscription |
| **Admin** | `admin@delhicoop.org` | `password123` | Verification queue, bulk roster onboarding, OLS demand forecast, dispute adjudication, welfare pool |
