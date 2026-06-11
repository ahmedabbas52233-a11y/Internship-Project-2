const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/server');
const { User, Post, Contact } = require('../src/models');

let mongoServer;

jest.setTimeout(30000);

describe('DecodeLabs Project 3 & 4 API', () => {
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
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@example.com', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send({ name: 'First', email: 'dup@example.com', password: 'password123' });
      const res = await request(app).post('/api/auth/register').send({ name: 'Second', email: 'dup@example.com', password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return token', async () => {
      await request(app).post('/api/auth/register').send({ name: 'Test', email: 'login@test.com', password: 'password123' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      await request(app).post('/api/auth/register').send({ name: 'Test', email: 'wrong@test.com', password: 'password123' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'password123' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const reg = await request(app).post('/api/auth/register').send({ name: 'Me', email: 'me@test.com', password: 'password123' });
      const token = reg.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('me@test.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('GET /api/users', () => {
    it('should return 200 with empty array initially', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return paginated users after seeding', async () => {
      await User.create([{ name: 'Alice', email: 'alice@test.com', password: 'password123' }, { name: 'Bob', email: 'bob@test.com', password: 'password123' }]);
      const res = await request(app).get('/api/users?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 200 for existing user', async () => {
      const user = await User.create({ name: 'Alice', email: 'alice@test.com', password: 'password123' });
      const res = await request(app).get(`/api/users/${user._id}`);
      expect(res.status).toBe(200);
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
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Test User');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/users').send({ name: 'First', email: 'dup@example.com', password: 'password123' });
      const res = await request(app).post('/api/users').send({ name: 'Second', email: 'dup@example.com', password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user name and return 200', async () => {
      const user = await User.create({ name: 'Alice', email: 'alice@test.com', password: 'password123' });
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .send({ name: 'Updated Alice' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Alice');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .send({ name: 'Ghost' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user and cascade delete posts', async () => {
      const user = await User.create({ name: 'To Delete', email: 'delete@test.com', password: 'password123' });
      await Post.create({ title: 'User Post', content: 'Content', authorId: user._id });

      const res = await request(app).delete(`/api/users/${user._id}`);
      expect(res.status).toBe(200);

      const postsRemaining = await Post.countDocuments({ authorId: user._id });
      expect(postsRemaining).toBe(0);
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

  describe('POST /api/posts', () => {
    it('should create a new post and return 201', async () => {
      const user = await User.create({ name: 'Author', email: 'author@test.com', password: 'password123' });
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Test Post', content: 'Test content', authorId: user._id.toString() });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Test Post');
    });

    it('should return 404 for non-existent author', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Test', content: 'Test', authorId: '507f1f77bcf86cd799439011' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete post and return 200', async () => {
      const user = await User.create({ name: 'Author', email: 'author@test.com', password: 'password123' });
      const post = await Post.create({ title: 'To Delete', content: 'Delete me', authorId: user._id });
      const res = await request(app).delete(`/api/posts/${post._id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Post deleted successfully');
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