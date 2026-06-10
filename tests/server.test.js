const request = require('supertest');
const app = require('/src/server');

describe('DecodeLabs Project 2 API', () => {

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
    it('should return 200 with paginated users', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    it('should respect pagination params', async () => {
      const res = await request(app).get('/api/users?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 200 for existing user', async () => {
      const res = await request(app).get('/api/users/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/users/abc');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/9999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user and return 201', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Test User', email: 'testuser@example.com' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.email).toBe('testuser@example.com');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.errors.some(e => e.field === 'name')).toBe(true);
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
      const res = await request(app)
        .put('/api/users/1')
        .send({ name: 'Updated Alice' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Alice');
    });

    it('should update user email and return 200', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .send({ email: 'updatedalice@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('updatedalice@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/9999')
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

    it('should return 409 for duplicate email', async () => {
      // User 2 has email bob@example.com
      const res = await request(app)
        .put('/api/users/1')
        .send({ email: 'bob@example.com' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user and return 200', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .send({ name: 'To Delete', email: 'todelete@example.com' });
      const id = createRes.body.data.id;

      const res = await request(app).delete(`/api/users/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).delete('/api/users/9999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/users/abc');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // POSTS
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('GET /api/posts', () => {
    it('should return 200 with paginated posts', async () => {
      const res = await request(app).get('/api/posts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return 200 for existing post', async () => {
      const res = await request(app).get('/api/posts/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/posts/abc');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/api/posts/9999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post and return 201', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Test Post', content: 'Test content here', authorId: 1 });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Post');
      expect(res.body.data.authorId).toBe(1);
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Test', authorId: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short title', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Hi', content: 'Test', authorId: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should return 404 for non-existent author', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Test Post', content: 'Test', authorId: 9999 });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update post title and return 200', async () => {
      const res = await request(app)
        .put('/api/posts/1')
        .send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .put('/api/posts/9999')
        .send({ title: 'Ghost' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent author on update', async () => {
      const res = await request(app)
        .put('/api/posts/1')
        .send({ authorId: 9999 });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete post and return 200', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .send({ title: 'To Delete', content: 'Delete me', authorId: 1 });
      const id = createRes.body.data.id;

      const res = await request(app).delete(`/api/posts/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Post deleted successfully');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).delete('/api/posts/9999');
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
      expect(res.body.message).toBe('Contact form submitted successfully');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 400 for short message', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'John', email: 'john@example.com', message: 'Hi' });
      expect(res.status).toBe(400);
      expect(res.body.error.errors.some(e => e.field === 'message')).toBe(true);
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'John', email: 'bad-email', message: 'This is a valid message content.' });
      expect(res.status).toBe(400);
      expect(res.body.error.errors.some(e => e.field === 'email')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // 404 HANDLER
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ERROR HANDLER
  // ═══════════════════════════════════════════════════════════════════════════════
  describe('Global Error Handler', () => {
    it('should handle unexpected errors gracefully', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{"name": "broken');
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});