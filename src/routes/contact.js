const express = require('express');
const router = express.Router();
const { Contact } = require('../models');

const errorResponse = (res, status, code, message, errors = null) => {
  const payload = { success: false, error: { code, message } };
  if (errors) payload.error.errors = errors;
  return res.status(status).json(payload);
};

// POST /api/contact — Submit contact form
router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      errors.push({ field: 'message', message: 'Message is required and must be at least 10 characters' });
    }

    if (errors.length > 0) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);

    const newContact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    });
    res.status(201).json({ success: true, data: newContact, message: 'Contact form submitted successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Validation failed', errors);
    }
    next(err);
  }
});

module.exports = router;
