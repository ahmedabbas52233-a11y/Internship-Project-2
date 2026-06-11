const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middleware/auth');

const errorResponse = (res, status, code, message, errors = null) => {
  const payload = { success: false, error: { code, message } };
  if (errors) payload.error.errors = errors;
  return res.status(status).json(payload);
};

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
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

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || 'decodelabs-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
        token
      }
    });
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 409, 'CONFLICT', 'Email already exists');
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Email and password are required');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'decodelabs-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — Protected route
router.get('/me', auth, async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

module.exports = router;
