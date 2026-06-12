require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');

const app = express();

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
    'http://localhost:5500',
    'http://localhost:3000',
    'https://ahmedabbas52233-a11y.github.io',
    'https://ahmedabbas52233-a11y.github.io/Internship-Project-1',
    null // Allow requests with no origin (curl, Postman, etc.)
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
});
app.use('/api/', limiter);

// ─── Database Connection ────────────────────────────────────────────────────
let useMemoryDB = false;

if (process.env.NODE_ENV !== 'test') {
    connectDB()
        .then(() => {
            console.log('✅ Using MongoDB Atlas');
        })
        .catch((err) => {
            console.log('⚠️ MongoDB unavailable, switching to in-memory database');
            console.log('   Reason:', err.message);
            const memoryDB = require('./config/db-memory');
            global.memoryDB = memoryDB;
            useMemoryDB = true;
        });
}

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'UP',
        database: useMemoryDB ? 'in-memory' : 'mongodb',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/stats', (req, res) => {
    if (useMemoryDB && global.memoryDB) {
        return res.json({ success: true, data: global.memoryDB.getStats() });
    }
    res.json({ success: true, data: { users: 0, posts: 0, contacts: 0 } });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/contact', contactRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        }
    });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🧠 Nervous System online at http://localhost:${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/api/health`);
        console.log(`   Mode: ${useMemoryDB ? 'IN-MEMORY (demo)' : 'MongoDB Atlas'}`);
    });
}

module.exports = app;