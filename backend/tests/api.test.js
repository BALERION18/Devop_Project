import request from 'supertest';
import app from '../src/app.js';

describe('DevOpsHub API Test Suite', () => {
  describe('Health Checks', () => {
    it('GET /api/health should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('database');
      expect(res.body).toHaveProperty('runtime');
    });

    it('GET / should return online confirmation message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('DevOpsHub API is online');
    });
  });

  describe('Authentication Validation', () => {
    it('POST /api/auth/signup should reject requests missing required fields', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'invalid-request@test.com',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should reject empty credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Route Protection & Security', () => {
    it('GET /api/deployments should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/deployments');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/server/status should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/server/status');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/dashboard/summary should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
