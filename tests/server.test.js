/**
 * DecodeLabs Project 2 — API Tests
 * Testing the Nervous System endpoints
 */

const request = require('supertest');
const app = require('../server');

describe('DecodeLabs API — Project 2', () => {

    // ============================================
    // HEALTH CHECK
    // ============================================
    describe('GET /api/health', () => {
        it('should return 200 with system status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('uptime');
        });
    });

    // ============================================
    // USERS ENDPOINTS
    // ============================================
    describe('GET /api/users', () => {
        it('should return all users (200)', async () => {
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.count).toBeGreaterThan(0);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return single user (200)', async () => {
            const res = await request(app).get('/api/users/1');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('id', 1);
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app).get('/api/users/999');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Not Found');
        });

        it('should return 400 for invalid ID', async () => {
            const res = await request(app).get('/api/users/abc');
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
        });
    });

    describe('POST /api/users', () => {
        it('should create new user (201)', async () => {
            const newUser = {
                name: 'Test Intern',
                email: 'test@decodelabs.in',
                role: 'intern'
            };

            const res = await request(app)
                .post('/api/users')
                .send(newUser);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.email).toBe('test@decodelabs.in');
        });

        it('should reject invalid email (400)', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'Test', email: 'invalid-email' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
        });

        it('should reject missing fields (400)', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'Test' });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Missing required fields');
        });

        it('should reject duplicate email (409)', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'Duplicate', email: 'ahmed@decodelabs.in' });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Conflict');
        });
    });

    // ============================================
    // POSTS ENDPOINTS
    // ============================================
    describe('GET /api/posts', () => {
        it('should return all posts with authors (200)', async () => {
            const res = await request(app).get('/api/posts');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data[0]).toHaveProperty('author');
        });
    });

    describe('POST /api/posts', () => {
        it('should create new post (201)', async () => {
            const newPost = {
                title: 'API Design Patterns',
                content: 'RESTful architecture best practices...',
                authorId: 2
            };

            const res = await request(app)
                .post('/api/posts')
                .send(newPost);

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('id');
        });

        it('should reject missing fields (400)', async () => {
            const res = await request(app)
                .post('/api/posts')
                .send({ title: 'Incomplete' });

            expect(res.status).toBe(400);
        });

        it('should reject invalid author (404)', async () => {
            const res = await request(app)
                .post('/api/posts')
                .send({
                    title: 'Test',
                    content: 'Content',
                    authorId: 999
                });

            expect(res.status).toBe(404);
        });
    });

    // ============================================
    // CONTACT FORM
    // ============================================
    describe('POST /api/contact', () => {
        it('should accept valid contact form (201)', async () => {
            const contact = {
                name: 'John Doe',
                email: 'john@example.com',
                subject: 'mentorship',
                message: 'I want to learn full stack development.'
            };

            const res = await request(app)
                .post('/api/contact')
                .send(contact);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
        });

        it('should reject short message (400)', async () => {
            const res = await request(app)
                .post('/api/contact')
                .send({
                    name: 'John',
                    email: 'john@example.com',
                    subject: 'general',
                    message: 'Hi'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('10 characters');
        });
    });

    // ============================================
    // ERROR HANDLING
    // ============================================
    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/api/unknown');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Not Found');
            expect(res.body).toHaveProperty('availableRoutes');
        });
    });
});
