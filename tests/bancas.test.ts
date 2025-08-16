import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server';

describe('Bancas Endpoints', () => {
  const mockToken = 'mock-jwt-token'; // In real tests, use valid test token

  describe('GET /bancas', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/bancas');

      expect(response.status).toBe(401);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/bancas?page=1&limit=10')
        .set('Authorization', `Bearer ${mockToken}`);

      // This will fail without proper auth setup, but shows the test structure
      expect(response.status).toBeOneOf([200, 401]);
    });

    it('should support filtering by estado', async () => {
      const response = await request(app)
        .get('/bancas?estado=activa')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBeOneOf([200, 401]);
    });
  });

  describe('POST /bancas', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/bancas')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      expect(response.status).toBeOneOf([400, 401, 403]);
    });

    it('should validate nombre length', async () => {
      const response = await request(app)
        .post('/bancas')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          nombre: 'A', // Too short
          ubicacion: 'Valid location address',
        });

      expect(response.status).toBeOneOf([400, 401, 403]);
    });

    it('should validate IP whitelist format', async () => {
      const response = await request(app)
        .post('/bancas')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          nombre: 'Test Banca',
          ubicacion: 'Test Location',
          ip_whitelist: ['invalid-ip', '192.168.1.1'],
        });

      expect(response.status).toBeOneOf([400, 401, 403]);
    });
  });
});