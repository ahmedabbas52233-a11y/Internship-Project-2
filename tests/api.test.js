// tests/api.test.js (optional - basic test)
const request = require('supertest');
const app = require('../src/server');

describe('API Endpoints', () => {
    test('GET /api/health returns UP', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('UP');
    });

    test('GET /api/users returns array', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('POST /api/contact creates message', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ name: 'Test', email: 'test@test.com', message: 'Hello' });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });
});