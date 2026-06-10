const express = require('express');
const router = express.Router();

// In-memory store (Project 2 requirement - no DB yet)
let users = [
  { id: 'usr_001', name: 'Ahmed Abbas', email: 'ahmed@example.com', createdAt: '2026-06-01T10:00:00Z' }
];

// GET /api/users - List all users
router.get('/', (req, res) => {
  res.status(200).json({
    count: users.length,
    data: users
  });
});

// GET /api/users/:id - Get single user
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'Not Found',
      message: `User with id ${req.params.id} not found`,
      code: 404
    });
  }
  
  res.status(200).json(user);
});

// POST /api/users - Create user
router.post('/', (req, res) => {
  const { name, email } = req.body;
  
  // Validation
  if (!name || !email) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name and email are required',
      code: 400
    });
  }
  
  if (name.length < 3 || name.length > 50) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name must be between 3 and 50 characters',
      code: 400
    });
  }
  
  // Check for duplicate email
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      error: 'Conflict',
      message: `User with email ${email} already exists`,
      code: 409
    });
  }
  
  const newUser = {
    id: `usr_${String(users.length + 1).padStart(3, '0')}`,
    name,
    email,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'User created successfully',
    data: newUser
  });
});

module.exports = router;