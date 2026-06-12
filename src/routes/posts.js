// src/routes/posts.js
const express = require('express');
const router = express.Router();

const getDB = () => {
    if (global.memoryDB) return global.memoryDB;
    try { return require('../config/db-memory'); } catch { return null; }
};

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const db = getDB();
        const posts = db ? db.getAllPosts() : [];
        res.json({ success: true, count: posts.length, data: posts });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Public
router.post('/', async (req, res, next) => {
    try {
        const { title, content, author, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Please provide title and content' }
            });
        }

        const db = getDB();
        const post = db ? db.createPost({ title, content, author, tags }) : req.body;

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;