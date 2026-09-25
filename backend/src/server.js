const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/database');
const initDb = require('./db/initDb');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allows local dev and demo frontends
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().split('T')[1].slice(0,8)}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Insta CoServe',
    version: '1.0.0',
    mode: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Centralized error handler
app.use(errorHandler);

async function startServer() {
  await db.init();
  await initDb();
  
  app.listen(env.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Insta CoServe Backend Running`);
    console.log(`   Port: ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Database: ${env.DB_PATH}`);
    console.log(`======================================================\n`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

module.exports = app;
