import { Router } from 'express';
import { JugadasService } from '@/modules/jugadas/jugadas.service';
import { CreateJugadaSchema, PaginationSchema } from '@/domain/schemas';
import { EstadoJugada } from '@/domain/types';
import { authGuard } from '@/middlewares/auth';
import { allRoles, adminOrSupervisor } from '@/middlewares/rbac';
import { ipGeoGuard } from '@/modules/security/ip-geo-guard';
import { createResponse, createPaginationMeta } from '@/shared/pagination';
import { z } from 'zod';

const router = Router();
const jugadasService = new JugadasService();

router.use(authGuard);

// GET /jugadas
router.get('/', allRoles, async (req, res, next) => {
  try {
    const pagination = PaginationSchema.parse(req.query);
    const filters = z.object({
      fecha_desde: z.string().optional(),
      fecha_hasta: z.string().optional(),
      banca_id: z.string().uuid().optional(),
      vendedor_id: z.string().uuid().optional(),
      sorteo_id: z.string().uuid().optional(),
      estado: z.nativeEnum(EstadoJugada).optional(),
      numero: z.coerce.number().int().min(0).max(99).optional(),
    }).parse(req.query);

    const { jugadas, total } = await jugadasService.findAll(pagination, filters);
    const meta = createPaginationMeta(pagination, total);

    res.json(createResponse(jugadas, meta, filters));
  } catch (error) {
    next(error);
  }
});

// GET /jugadas/:id
router.get('/:id', allRoles, async (req, res, next) => {
  try {
    const jugada = await jugadasService.findById(req.params.id);
    res.json(createResponse(jugada));
  } catch (error) {
    next(error);
  }
});

// POST /jugadas
router.post('/', allRoles, ipGeoGuard(), async (req, res, next) => {
  try {
    const data = CreateJugadaSchema.parse(req.body);
    const jugada = await jugadasService.create(data);
    res.status(201).json(createResponse(jugada));
  } catch (error) {
    next(error);
  }
});

// POST /jugadas/:id/anular
router.post('/:id/anular', adminOrSupervisor, async (req, res, next) => {
  try {
    const jugada = await jugadasService.anular(req.params.id);
    res.json(createResponse(jugada));
  } catch (error) {
    next(error);
  }
});

// POST /jugadas/batch
router.post('/batch', allRoles, ipGeoGuard(), async (req, res, next) => {
  try {
    const { jugadas } = z.object({
      jugadas: z.array(CreateJugadaSchema),
    }).parse(req.body);

    const result = await jugadasService.createBatch(jugadas);
    res.status(201).json(createResponse(result));
  } catch (error) {
    next(error);
  }
});

export default router;