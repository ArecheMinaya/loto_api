import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { requestId } from '@/middlewares/request-id';
import { errorHandler } from '@/middlewares/error-handler';

// Import routes
import authRoutes from '@/routes/auth.routes';
import bancasRoutes from '@/routes/bancas.routes';
import vendedoresRoutes from '@/routes/vendedores.routes';
import jugadasRoutes from '@/routes/jugadas.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  }),
);

// Trust proxy if configured
if (env.TRUST_PROXY) {
  app.set('trust proxy', true);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Request ID and logging
app.use(requestId);
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Documentation
try {
  const swaggerDocument = YAML.load('./docs/openapi.yml');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.warn('Could not load OpenAPI documentation');
}

// API Routes
app.use('/auth', authRoutes);
app.use('/bancas', bancasRoutes);
app.use('/vendedores', vendedoresRoutes);
app.use('/jugadas', jugadasRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${env.PORT}/docs`);
  logger.info(`🏥 Health Check: http://localhost:${env.PORT}/health`);
});

export default app;
