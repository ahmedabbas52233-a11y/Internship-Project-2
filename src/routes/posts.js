const express = require('express');
const router = express.Router();
const { User, Post } = require('../models');
const mongoose = require('mongoose');

const errorResponse = (res, status, code, message, errors = null) => {
  const payload = { success: false, error: { code, message } };
  if (errors) payload.error.errors = errors;
  return res.status(status).json(payload);
};

// GET /api/posts — List all posts (with pagination)
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find().populate('authorId', 'name email').skip(skip).limit(limit).lean(),
      Post.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
});

// GET /api/posts/:id — Get single post
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid post ID format', [{ field: 'id', message: 'Invalid post ID format' }]);
    }
    const post = await Post.findById(req.params.id).populate('authorId', 'name email');
    if (!post) return errorResponse(res, 404, 'NOT_FOUND', 'Post not found');
    res.status(200).json({ success: true, data: post });
  } catch (err) { next(err); }
});

// POST /api/posts — Create post
router.post('/', async (req, res, next) => {
  try {
    const { title, content, authorId } = req.body;
    const errors = [];

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title is required and must be at least 3 characters' });
    }
    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      errors.push({ field: 'content', message: 'Content is required' });
    }
    if (!authorId || !mongoose.isValidObjectId(authorId)) {
      errors.push({ field: 'authorId', message: 'Valid authorId is required' });
    }
    if (errors.length > 0) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);

    const authorExists = await User.exists({ _id: authorId });
    if (!authorExists) return errorResponse(res, 404, 'NOT_FOUND', 'Author user not found');

    const newPost = await Post.create({ title: title.trim(), content: content.trim(), authorId });
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    }
    next(err);
  }
});

// PUT /api/posts/:id — Update post
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid post ID format', [{ field: 'id', message: 'Invalid post ID format' }]);
    }

    const { title, content, authorId } = req.body;
    const updateData = {};
    const errors = [];

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3) {
        errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
      } else {
        updateData.title = title.trim();
      }
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length < 1) {
        errors.push({ field: 'content', message: 'Content cannot be empty' });
      } else {
        updateData.content = content.trim();
      }
    }

    if (authorId !== undefined) {
      if (!mongoose.isValidObjectId(authorId)) {
        errors.push({ field: 'authorId', message: 'Valid authorId is required' });
      } else {
        const authorExists = await User.exists({ _id: authorId });
        if (!authorExists) return errorResponse(res, 404, 'NOT_FOUND', 'Author user not found');
        updateData.authorId = authorId;
      }
    }

    if (errors.length > 0) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    if (Object.keys(updateData).length === 0) return errorResponse(res, 400, 'VALIDATION_ERROR', 'No valid fields to update');

    const post = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('authorId', 'name email');
    if (!post) return errorResponse(res, 404, 'NOT_FOUND', 'Post not found');
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    }
    next(err);
  }
});

// DELETE /api/posts/:id — Delete post
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid post ID format', [{ field: 'id', message: 'Invalid post ID format' }]);
    }

    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return errorResponse(res, 404, 'NOT_FOUND', 'Post not found');
    res.status(200).json({ success: true, data: post, message: 'Post deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
