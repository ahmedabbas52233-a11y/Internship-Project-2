const express = require('express');
const router = express.Router();

let posts = [
  { id: 'pst_001', title: 'Hello World', content: 'First post', authorId: 'usr_001', createdAt: '2026-06-01T12:00:00Z' }
];

// GET /api/posts - List all posts
router.get('/', (req, res) => {
  res.status(200).json({
    count: posts.length,
    data: posts
  });
});

// POST /api/posts - Create post
router.post('/', (req, res) => {
  const { title, content, authorId } = req.body;
  
  if (!title || !content || !authorId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Title, content, and authorId are required',
      code: 400
    });
  }
  
  const newPost = {
    id: `pst_${String(posts.length + 1).padStart(3, '0')}`,
    title,
    content,
    authorId,
    createdAt: new Date().toISOString()
  };
  
  posts.push(newPost);
  
  res.status(201).json({
    message: 'Post created successfully',
    data: newPost
  });
});

module.exports = router;