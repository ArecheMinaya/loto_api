import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { supabase } from '../src/config/supabase';

describe('Authentication Endpoints', () => {
  describe('POST /auth/register', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      nombre: 'Test User',
      rol: 'operador' as const,
    };

    afterEach(async () => {
      // Clean up test user
      const { data: user } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', testUser.email)
        .single();
      
      if (user) {
        await supabase.auth.admin.deleteUser(user.id);
      }
    });

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('session');
      expect(response.body.data.message).toBe('Usuario registrado exitosamente');
    });

    it('should require email, password, and nombre', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
    });

    it('should require minimum password length', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...testUser,
          password: '123',
        });

      expect(response.status).toBe(400);
    });

    it('should prevent duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send(testUser);

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(response.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should require email and password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should require minimum password length', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});