const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
});
app.use('/api/', limiter);

// ─── In-Memory Storage ──────────────────────────────────────────────────────
let users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' }
];

let posts = [
  { id: 1, title: 'Hello World', content: 'First post content', authorId: 1 },
  { id: 2, title: 'API Design', content: 'RESTful principles', authorId: 2 }
];

let contacts = [];
let nextUserId = 3;
let nextPostId = 3;
let nextContactId = 1;

// ─── Validation Utilities ─────────────────────────────────────────────────────
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const isValidId = (id) => {
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
};

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'UP', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════

// List all users (with optional pagination)
app.get('/api/users', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = users.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit)
    }
  });
});

// Get single user
app.get('/api/users/:id', (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid user ID format', field: 'id' }
    });
  }
  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }
  res.status(200).json({ success: true, data: user });
});

// Create user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters' });
  }
  if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', errors } });
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Email already exists' }
    });
  }

  const newUser = {
    id: nextUserId++,
    name: name.trim(),
    email: trimmedEmail
  };
  users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
});

// Update user
app.put('/api/users/:id', (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid user ID format', field: 'id' }
    });
  }

  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }

  const { name, email } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    } else {
      user.name = name.trim();
    }
  }

  if (email !== undefined) {
    if (!isValidEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    } else {
      const trimmedEmail = email.trim().toLowerCase();
      if (users.some(u => u.id !== user.id && u.email.toLowerCase() === trimmedEmail)) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Email already exists' }
        });
      }
      user.email = trimmedEmail;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', errors } });
  }

  res.status(200).json({ success: true, data: user });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid user ID format', field: 'id' }
    });
  }

  const index = users.findIndex(u => u.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }

  const deleted = users.splice(index, 1)[0];
  res.status(200).json({ success: true, data: deleted, message: 'User deleted successfully' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POSTS
// ═══════════════════════════════════════════════════════════════════════════════

// List all posts (with optional pagination)
app.get('/api/posts', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPosts = posts.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: paginatedPosts,
    pagination: {
      page,
      limit,
      total: posts.length,
      totalPages: Math.ceil(posts.length / limit)
    }
  });
});

// Get single post
app.get('/api/posts/:id', (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid post ID format', field: 'id' }
    });
  }
  const post = posts.find(p => p.id === parseInt(req.params.id, 10));
  if (!post) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Post not found' }
    });
  }
  res.status(200).json({ success: true, data: post });
});

// Create post
app.post('/api/posts', (req, res) => {
  const { title, content, authorId } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title is required and must be at least 3 characters' });
  }
  if (!content || typeof content !== 'string' || content.trim().length < 1) {
    errors.push({ field: 'content', message: 'Content is required' });
  }
  if (!isValidId(authorId)) {
    errors.push({ field: 'authorId', message: 'Valid authorId is required' });
  } else if (!users.some(u => u.id === parseInt(authorId, 10))) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Author user not found' }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', errors } });
  }

  const newPost = {
    id: nextPostId++,
    title: title.trim(),
    content: content.trim(),
    authorId: parseInt(authorId, 10),
    createdAt: new Date().toISOString()
  };
  posts.push(newPost);
  res.status(201).json({ success: true, data: newPost });
});

// Update post
app.put('/api/posts/:id', (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid post ID format', field: 'id' }
    });
  }

  const post = posts.find(p => p.id === parseInt(req.params.id, 10));
  if (!post) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Post not found' }
    });
  }

  const { title, content, authorId } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    } else {
      post.title = title.trim();
    }
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length < 1) {
      errors.push({ field: 'content', message: 'Content cannot be empty' });
    } else {
      post.content = content.trim();
    }
  }

  if (authorId !== undefined) {
    if (!isValidId(authorId)) {
      errors.push({ field: 'authorId', message: 'Valid authorId is required' });
    } else if (!users.some(u => u.id === parseInt(authorId, 10))) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Author user not found' }
      });
    } else {
      post.authorId = parseInt(authorId, 10);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', errors } });
  }

  post.updatedAt = new Date().toISOString();
  res.status(200).json({ success: true, data: post });
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid post ID format', field: 'id' }
    });
  }

  const index = posts.findIndex(p => p.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Post not found' }
    });
  }

  const deleted = posts.splice(index, 1)[0];
  res.status(200).json({ success: true, data: deleted, message: 'Post deleted successfully' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════════════════════════

// Stricter rate limit for contact form (public, abuse-prone)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many contact submissions' } }
});

app.post('/api/contact', contactLimiter, (req, res) => {
  const { name, email, message } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters' });
  }
  if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    errors.push({ field: 'message', message: 'Message is required and must be at least 10 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', errors } });
  }

  const newContact = {
    id: nextContactId++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    submittedAt: new Date().toISOString()
  };
  contacts.push(newContact);
  res.status(201).json({ success: true, data: newContact, message: 'Contact form submitted successfully' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our end' }
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🧠 Nervous System online at http://localhost:${PORT}`);
  });
}

module.exports = app;