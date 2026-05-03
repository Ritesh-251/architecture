require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// ── Validate env vars ──
['MONGO_URI', 'JWT_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`ERROR: Missing env var "${key}". Check .env file.`);
    process.exit(1);
  }
});

const authRoutes    = require('./routes/auth');
const designRoutes  = require('./routes/designs');

const app = express();

// ── Security & Performance ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));

// ── Rate limiting on auth endpoints ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100, // Increased for development
  message: { error: 'Too many requests. Please try again later.', code: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/designs', designRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Architecture Master API is running', version: '2.0' });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', code: 404 });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: status,
  });
});

// ── Connect to MongoDB & Start ──
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB:', process.env.MONGO_URI);
    // Create indexes
    const Design = require('./models/Design');
    Design.createIndexes().catch(console.error);

    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });

