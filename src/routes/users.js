const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { User, Post } = require('../models');

const errorResponse = (res, status, code, message, errors = null) => {
  const payload = { success: false, error: { code, message } };
  if (errors) payload.error.errors = errors;
  return res.status(status).json(payload);
};

// GET /api/users — List all users (with pagination)
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit).lean(),
      User.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { next(err); }
});

// GET /api/users/:id — Get single user
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format', [{ field: 'id', message: 'Invalid user ID format' }]);
    }
    const user = await User.findById(req.params.id).select('-password').populate('posts', 'title content createdAt');
    if (!user) return errorResponse(res, 404, 'NOT_FOUND', 'User not found');
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
});

// POST /api/users — Create user (admin-style, accepts password)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push({ field: 'password', message: 'Password is required and must be at least 6 characters' });
    }
    if (errors.length > 0) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);

    const newUser = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password });
    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json({ success: true, data: userResponse });
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 409, 'CONFLICT', 'Email already exists');
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    }
    next(err);
  }
});

// PUT /api/users/:id — Update user
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format', [{ field: 'id', message: 'Invalid user ID format' }]);
    }

    const { name, email, password } = req.body;
    const updateData = {};
    const errors = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
      } else {
        updateData.name = name.trim();
      }
    }

    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.push({ field: 'email', message: 'Valid email is required' });
      } else {
        updateData.email = email.trim().toLowerCase();
      }
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
      } else {
        updateData.password = password;
      }
    }

    if (errors.length > 0) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    if (Object.keys(updateData).length === 0) return errorResponse(res, 400, 'VALIDATION_ERROR', 'No valid fields to update');

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!user) return errorResponse(res, 404, 'NOT_FOUND', 'User not found');
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 409, 'CONFLICT', 'Email already exists');
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    }
    next(err);
  }
});

// DELETE /api/users/:id — Delete user
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format', [{ field: 'id', message: 'Invalid user ID format' }]);
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, 404, 'NOT_FOUND', 'User not found');

    // Cascade delete: remove all posts by this user
    await Post.deleteMany({ authorId: req.params.id });

    res.status(200).json({ success: true, data: user, message: 'User and associated posts deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;