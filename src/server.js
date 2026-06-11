const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');

const app = express();

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
});
app.use('/api/', limiter);

// ─── Database Connection ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'UP', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/contact', contactRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🧠 Nervous System online at http://localhost:${PORT}`);
  });
}

module.exports = app;
