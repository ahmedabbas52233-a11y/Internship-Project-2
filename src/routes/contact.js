// src/routes/contact.js
const express = require('express');
const router = express.Router();

const getDB = () => {
    if (global.memoryDB) return global.memoryDB;
    try { return require('../config/db-memory'); } catch { return null; }
};

// @route   GET /api/contact
// @desc    Get all contact messages
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const db = getDB();
        const contacts = db ? db.getAllContacts() : [];
        res.json({ success: true, count: contacts.length, data: contacts });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/contact
// @desc    Submit a contact message
// @access  Public
router.post('/', async (req, res, next) => {
    try {
        const { name, email, message, subject } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Please provide name, email, and message' }
            });
        }

        const db = getDB();
        const contact = db ? db.createContact({ name, email, message, subject }) : req.body;

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: contact
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;