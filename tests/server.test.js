const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/server');
const { User, Post, Contact } = require('../src/models');

let mongoServer;

// Increase Jest timeout for slow Windows machines
jest.setTimeout(30000);

describe('DecodeLabs Project 3 API', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: 'jest' },
      binary: { downloadDir: './node_modules/.cache/mongodb-memory-server' }
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
    await Contact.deleteMany({});
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('GET /api/health', () => {
    it('should return 200 with status UP', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('UP');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('GET /api/users', () => {
    it('should return 200 with empty array initially', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should return paginated users after seeding', async () => {
      await User.create([{ name: 'Alice', email: 'alice@test.com' }, { name: 'Bob', email: 'bob@test.com' }]);
      const res = await request(app).get('/api/users?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 200 for existing user', async () => {
      const user = await User.create({ name: 'Alice', email: 'alice@test.com' });
      const res = await request(app).get(`/api/users/${user._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Alice');
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/users/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user and return 201', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Test User', email: 'test@example.com' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Test', email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/users').send({ name: 'First', email: 'dup@example.com' });
      const res = await request(app).post('/api/users').send({ name: 'Second', email: 'dup@example.com' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user name and return 200', async () => {
      const user = await User.create({ name: 'Alice', email: 'alice@test.com' });
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .send({ name: 'Updated Alice' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Alice');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .send({ name: 'Ghost' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .put('/api/users/abc')
        .send({ name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user and cascade delete posts', async () => {
      const user = await User.create({ name: 'To Delete', email: 'delete@test.com' });
      await Post.create({ title: 'User Post', content: 'Content', authorId: user._id });

      const res = await request(app).delete(`/api/users/${user._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const postsRemaining = await Post.countDocuments({ authorId: user._id });
      expect(postsRemaining).toBe(0);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).delete('/api/users/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // POSTS
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('GET /api/posts', () => {
    it('should return 200 with empty array initially', async () => {
      const res = await request(app).get('/api/posts');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return 200 for existing post', async () => {
      const user = await User.create({ name: 'Author', email: 'author@test.com' });
      const post = await Post.create({ title: 'Test', content: 'Content', authorId: user._id });
      const res = await request(app).get(`/api/posts/${post._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Test');
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/posts/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/api/posts/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post and return 201', async () => {
      const user = await User.create({ name: 'Author', email: 'author@test.com' });
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Test Post', content: 'Test content', authorId: user._id.toString() });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Post');
    });

    it('should return 400 for missing title', async () => {
      const user = await User.create({ name: 'Author', email: 'author@test.com' });
      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Test', authorId: user._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent author', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Test', content: 'Test', authorId: '507f1f77bcf86cd799439011' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update post title and return 200', async () => {
      const user = await User.create({ name: 'Author', email: 'author@test.com' });
      const post = await Post.create({ title: 'Old', content: 'Content', authorId: user._id });
      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .put('/api/posts/507f1f77bcf86cd799439011')
        .send({ title: 'Ghost' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete post and return 200', async () => {
      const user = await User.create({ name: 'Author', email: 'author@test.com' });
      const post = await Post.create({ title: 'To Delete', content: 'Delete me', authorId: user._id });
      const res = await request(app).delete(`/api/posts/${post._id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Post deleted successfully');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).delete('/api/posts/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONTACT
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('POST /api/contact', () => {
    it('should submit contact form and return 201', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'John Doe', email: 'john@example.com', message: 'Hello, this is a test message.' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short message', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'John', email: 'john@example.com', message: 'Hi' });
      expect(res.status).toBe(400);
      expect(res.body.error.errors.some(e => e.field === 'message')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 404 HANDLER
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});