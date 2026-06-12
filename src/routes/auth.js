// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo-only';

function getDB() {
    if (global.memoryDB) return global.memoryDB;
    try { return require('../config/db-memory'); } catch { return null; }
}

// @route   POST /api/auth/register
router.post('/register', async function(req, res, next) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Please provide name, email, and password' }
            });
        }

        const db = getDB();

        if (db && db.findUserByEmail(email)) {
            return res.status(409).json({
                success: false,
                error: { code: 'DUPLICATE_ERROR', message: 'User already exists with this email' }
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = null;
        if (db) {
            user = db.createUser({ name, email, password: hashedPassword });
        }

        const token = jwt.sign(
            { userId: user ? user._id : 'demo-id' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: user ? { id: user._id, name: user.name, email: user.email } : { name, email }
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/login
router.post('/login', async function(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Please provide email and password' }
            });
        }

        const db = getDB();
        const user = db ? db.findUserByEmail(email) : null;

        if (!user) {
            return res.status(401).json({
                success: false,
                error: { code: 'AUTH_ERROR', message: 'Invalid credentials' }
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: { code: 'AUTH_ERROR', message: 'Invalid credentials' }
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: { id: user._id, name: user.name, email: user.email }
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/auth/me
router.get('/me', async function(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: { code: 'AUTH_ERROR', message: 'No token provided' }
            });
        }

        const token = authHeader.replace('Bearer ', '');

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: { code: 'AUTH_ERROR', message: 'Invalid token' }
            });
        }

        const db = getDB();
        const user = db ? db.findUserById(decoded.userId) : null;

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' }
            });
        }

        res.json({
            success: true,
            data: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;