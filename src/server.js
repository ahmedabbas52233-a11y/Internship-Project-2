/**
 * DecodeLabs Project 2 — Backend API Development
 * The Nervous System: RESTful API with validation & error handling
 * 
 * Martina Plantijn: "Project 1 was the skin. Project 2 is the life."
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE STACK (Autonomic Defense)
// ============================================

// Security headers
app.use(helmet());

// CORS — allow frontend origin
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (Circuit Breaker)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        status: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
    }
});
app.use('/api/', limiter);

// ============================================
// IN-MEMORY DATABASE (Temporary — until Project 3)
// ============================================

let users = [
    { id: 1, name: 'Ahmed Abbas', email: 'ahmed@decodelabs.in', role: 'intern' },
    { id: 2, name: 'Martina Plantijn', email: 'martina@decodelabs.in', role: 'mentor' }
];

let posts = [
    { id: 1, title: 'Semantic HTML5', content: 'The infrastructure of the web...', authorId: 2 },
    { id: 2, title: 'CSS Grid Mastery', content: '2D floor-plan for layouts...', authorId: 2 }
];

// ============================================
// VALIDATION HELPERS (The Gatekeeper Rule)
// ============================================

const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const validateRequired = (obj, fields) => {
    const missing = fields.filter(field => !obj[field] || obj[field].toString().trim() === '');
    return missing.length === 0 ? null : missing;
};

// ============================================
// ROUTES — USER ENDPOINTS
// ============================================

/**
 * GET /api/users
 * Retrieve all users (safe, idempotent)
 */
app.get('/api/users', (req, res) => {
    res.status(200).json({
        status: 'success',
        count: users.length,
        data: users
    });
});

/**
 * GET /api/users/:id
 * Retrieve single user by ID
 */
app.get('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            status: 'error',
            error: 'Bad Request',
            message: 'User ID must be a valid number'
        });
    }

    const user = users.find(u => u.id === id);

    if (!user) {
        return res.status(404).json({
            status: 'error',
            error: 'Not Found',
            message: `User with ID ${id} not found`
        });
    }

    res.status(200).json({
        status: 'success',
        data: user
    });
});

/**
 * POST /api/users
 * Create a new user (unsafe, non-idempotent)
 */
app.post('/api/users', (req, res) => {
    const { name, email, role } = req.body;

    // Validation: Never trust the client
    const missing = validateRequired(req.body, ['name', 'email']);
    if (missing) {
        return res.status(400).json({
            status: 'error',
            error: 'Bad Request',
            message: `Missing required fields: ${missing.join(', ')}`
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            status: 'error',
            error: 'Bad Request',
            message: 'Invalid email format'
        });
    }

    // Check for duplicate email
    if (users.some(u => u.email === email)) {
        return res.status(409).json({
            status: 'error',
            error: 'Conflict',
            message: 'Email already registered'
        });
    }

    const newUser = {
        id: users.length + 1,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || 'intern',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: newUser
    });
});

// ============================================
// ROUTES — POST ENDPOINTS
// ============================================

/**
 * GET /api/posts
 * Retrieve all posts
 */
app.get('/api/posts', (req, res) => {
    const postsWithAuthors = posts.map(post => ({
        ...post,
        author: users.find(u => u.id === post.authorId)?.name || 'Unknown'
    }));

    res.status(200).json({
        status: 'success',
        count: posts.length,
        data: postsWithAuthors
    });
});

/**
 * POST /api/posts
 * Create a new post
 */
app.post('/api/posts', (req, res) => {
    const { title, content, authorId } = req.body;

    const missing = validateRequired(req.body, ['title', 'content', 'authorId']);
    if (missing) {
        return res.status(400).json({
            status: 'error',
            error: 'Bad Request',
            message: `Missing required fields: ${missing.join(', ')}`
        });
    }

    const author = users.find(u => u.id === parseInt(authorId));
    if (!author) {
        return res.status(404).json({
            status: 'error',
            error: 'Not Found',
            message: 'Author not found'
        });
    }

    const newPost = {
        id: posts.length + 1,
        title: title.trim(),
        content: content.trim(),
        authorId: parseInt(authorId),
        createdAt: new Date().toISOString()
    };

    posts.push(newPost);

    res.status(201).json({
        status: 'success',
        message: 'Post created successfully',
        data: newPost
    });
});

// ============================================
// ROUTES — CONTACT FORM (Connects to Project 1)
// ============================================

/**
 * POST /api/contact
 * Handle contact form submissions from Project 1 frontend
 */
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;

    const missing = validateRequired(req.body, ['name', 'email', 'subject', 'message']);
    if (missing) {
        return res.status(400).json({
            status: 'error',
            error: 'Bad Request',
            message: `Missing required fields: ${missing.join(', ')}`
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            status: 'error',
            error: 'Bad Request',
            message: 'Invalid email format'
        });
    }

    if (message.length < 10) {
        return res.status(400).json({
            status: 'error',
            error: 'Bad Request',
            message: 'Message must be at least 10 characters'
        });
    }

    // In production, this would send an email or store in DB
    const submission = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject,
        message: message.trim(),
        receivedAt: new Date().toISOString()
    };

    res.status(201).json({
        status: 'success',
        message: 'Message received successfully',
        data: submission
    });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'System pulse: stable',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// ERROR HANDLING (Error Resilience)
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableRoutes: [
            'GET    /api/health',
            'GET    /api/users',
            'GET    /api/users/:id',
            'POST   /api/users',
            'GET    /api/posts',
            'POST   /api/posts',
            'POST   /api/contact'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        status: 'error',
        error: err.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : err.message
    });
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   DecodeLabs Project 2 — API Server      ║
    ║   The Nervous System is online           ║
    ╠══════════════════════════════════════════╣
    ║   Port: ${PORT.toString().padEnd(33)} ║
    ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(25)} ║
    ║   Health: http://localhost:${PORT}/api/health  ║
    ╚══════════════════════════════════════════╝
    `);
});

module.exports = app;
