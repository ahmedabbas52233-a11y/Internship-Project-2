const express = require('express');
const router = express.Router();

// POST /api/contact - Submit contact form (connects to Project 1)
router.post('/', (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name, email, and message are required',
      code: 400
    });
  }
  
  // Simulate processing
  const submission = {
    id: `cnt_${Date.now()}`,
    name,
    email,
    message,
    submittedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    message: 'Contact form submitted successfully',
    data: submission
  });
});

module.exports = router;