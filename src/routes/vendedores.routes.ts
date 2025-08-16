import { Router } from 'express';
import { VendedoresService } from '@/modules/vendedores/vendedores.service';
import { CreateVendedorSchema, UpdateVendedorSchema, PaginationSchema } from '@/domain/schemas';
import { EstadoVendedor } from '@/domain/types';
import { authGuard } from '@/middlewares/auth';
import { adminOnly, adminOrSupervisor } from '@/middlewares/rbac';
import { createResponse, createPaginationMeta } from '@/shared/pagination';
import { z } from 'zod';

const router = Router();
const vendedoresService = new VendedoresService();

router.use(authGuard);

// GET /vendedores
router.get('/', adminOrSupervisor, async (req, res, next) => {
  try {
    const pagination = PaginationSchema.parse(req.query);
    const filters = z.object({
      estado: z.nativeEnum(EstadoVendedor).optional(),
    }).parse(req.query);

    const { vendedores, total } = await vendedoresService.findAll(pagination, filters);
    const meta = createPaginationMeta(pagination, total);

    res.json(createResponse(vendedores, meta, filters));
  } catch (error) {
    next(error);
  }
});

// GET /vendedores/:id
router.get('/:id', adminOrSupervisor, async (req, res, next) => {
  try {
    const vendedor = await vendedoresService.findById(req.params.id);
    res.json(createResponse(vendedor));
  } catch (error) {
    next(error);
  }
});

// POST /vendedores
router.post('/', adminOrSupervisor, async (req, res, next) => {
  try {
    const data = CreateVendedorSchema.parse(req.body);
    const vendedor = await vendedoresService.create(data);
    res.status(201).json(createResponse(vendedor));
  } catch (error) {
    next(error);
  }
});

// PATCH /vendedores/:id
router.patch('/:id', adminOrSupervisor, async (req, res, next) => {
  try {
    const data = UpdateVendedorSchema.parse(req.body);
    const vendedor = await vendedoresService.update(req.params.id, data);
    res.json(createResponse(vendedor));
  } catch (error) {
    next(error);
  }
});

// POST /vendedores/:id/bancas
router.post('/:id/bancas', adminOrSupervisor, async (req, res, next) => {
  try {
    const { banca_ids } = z.object({
      banca_ids: z.array(z.string().uuid()),
    }).parse(req.body);

    await vendedoresService.assignToBancas(req.params.id, banca_ids);
    res.json(createResponse({ message: 'Vendedor asignado a bancas exitosamente' }));
  } catch (error) {
    next(error);
  }
});

// GET /vendedores/:id/bancas
router.get('/:id/bancas', adminOrSupervisor, async (req, res, next) => {
  try {
    const bancas = await vendedoresService.getBancas(req.params.id);
    res.json(createResponse(bancas));
  } catch (error) {
    next(error);
  }
});

// DELETE /vendedores/:id/bancas/:bancaId
router.delete('/:id/bancas/:bancaId', adminOrSupervisor, async (req, res, next) => {
  try {
    await vendedoresService.removeBanca(req.params.id, req.params.bancaId);
    res.json(createResponse({ message: 'Vendedor removido de la banca exitosamente' }));
  } catch (error) {
    next(error);
  }
});

export default router;