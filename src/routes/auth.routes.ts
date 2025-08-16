import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '@/modules/auth/auth.service';
import { authGuard } from '@/middlewares/auth';
import { createResponse } from '@/shared/pagination';
import { RegisterUsuarioSchema } from '@/domain/schemas';

const router = Router();
const authService = new AuthService();

// Login schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const userData = RegisterUsuarioSchema.parse(req.body);
    const result = await authService.register(userData);
    
    res.status(201).json(createResponse({
      user: result.user,
      session: result.session,
      message: 'Usuario registrado exitosamente',
    }));
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await authService.login(email, password);
    
    res.json(createResponse({
      user: result.user,
      session: result.session,
    }));
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', authGuard, async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    res.json(createResponse(user));
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', authGuard, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7) || '';
    await authService.logout(token);
    res.json(createResponse({ message: 'Sesión cerrada exitosamente' }));
  } catch (error) {
    next(error);
  }
});

export default router;