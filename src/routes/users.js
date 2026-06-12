// src/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const getDB = () => {
    if (global.memoryDB) return global.memoryDB;
    try { return require('../config/db-memory'); } catch { return null; }
};

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const db = getDB();
        const users = db ? db.getAllUsers() : [];
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Public
router.post('/', async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

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
                error: { code: 'DUPLICATE_ERROR', message: 'User already exists' }
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = db ? db.createUser({ name, email, password: hashedPassword, role }) : null;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user ? { id: user._id, name: user.name, email: user.email, role: user.role } : req.body
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;