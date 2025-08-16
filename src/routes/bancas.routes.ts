import { Router } from 'express';
import { BancasService } from '@/modules/bancas/bancas.service';
import { CreateBancaSchema, UpdateBancaSchema, PaginationSchema } from '@/domain/schemas';
import { EstadoBanca } from '@/domain/types';
import { authGuard } from '@/middlewares/auth';
import { adminOnly, adminOrSupervisor } from '@/middlewares/rbac';
import { createResponse, createPaginationMeta } from '@/shared/pagination';
import { z } from 'zod';

const router = Router();
const bancasService = new BancasService();

// Apply auth to all routes
router.use(authGuard);

// GET /bancas
router.get('/', adminOrSupervisor, async (req, res, next) => {
  try {
    const pagination = PaginationSchema.parse(req.query);
    const filters = z.object({
      estado: z.nativeEnum(EstadoBanca).optional(),
    }).parse(req.query);

    const { bancas, total } = await bancasService.findAll(pagination, filters);
    const meta = createPaginationMeta(pagination, total);

    res.json(createResponse(bancas, meta, filters));
  } catch (error) {
    next(error);
  }
});

// GET /bancas/:id
router.get('/:id', adminOrSupervisor, async (req, res, next) => {
  try {
    const banca = await bancasService.findById(req.params.id);
    res.json(createResponse(banca));
  } catch (error) {
    next(error);
  }
});

// POST /bancas
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const data = CreateBancaSchema.parse(req.body);
    const banca = await bancasService.create(data);
    res.status(201).json(createResponse(banca));
  } catch (error) {
    next(error);
  }
});

// PATCH /bancas/:id
router.patch('/:id', adminOnly, async (req, res, next) => {
  try {
    const data = UpdateBancaSchema.parse(req.body);
    const banca = await bancasService.update(req.params.id, data);
    res.json(createResponse(banca));
  } catch (error) {
    next(error);
  }
});

// POST /bancas/:id/activar
router.post('/:id/activar', adminOnly, async (req, res, next) => {
  try {
    const banca = await bancasService.activate(req.params.id);
    res.json(createResponse(banca));
  } catch (error) {
    next(error);
  }
});

// POST /bancas/:id/desactivar
router.post('/:id/desactivar', adminOnly, async (req, res, next) => {
  try {
    const banca = await bancasService.deactivate(req.params.id);
    res.json(createResponse(banca));
  } catch (error) {
    next(error);
  }
});

export default router;