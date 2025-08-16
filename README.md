# Lottery Admin Backend

Backend MVP para plataforma administrativa de bancas de lotería dominicanas.

## 🚀 Tecnologías

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js con TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Validación**: Zod
- **Logging**: Pino
- **Documentación**: OpenAPI 3.1 + Swagger UI
- **Testing**: Vitest + Supertest
- **Containerización**: Docker + Docker Compose

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuración (env, supabase, logger)
├── domain/          # Esquemas Zod y tipos TypeScript
├── modules/         # Módulos de negocio
│   ├── auth/        # Autenticación
│   ├── bancas/      # Gestión de bancas
│   ├── vendedores/  # Gestión de vendedores
│   ├── jugadas/     # Gestión de jugadas/apuestas
│   ├── sorteos/     # Sorteos/loterías
│   ├── reportes/    # Reportes y estadísticas
│   ├── dashboard/   # Métricas del dashboard
│   ├── auditoria/   # Logs de auditoría
│   └── security/    # Seguridad IP/Geolocalización
├── shared/          # Utilidades compartidas
├── routes/          # Rutas de la API
├── middlewares/     # Middleware personalizados
├── infra/           # Migraciones y seeds de BD
│   ├── migrations/  # Migraciones SQL
│   └── seeds/       # Datos de prueba
└── server.ts        # Punto de entrada
```

## ⚙️ Configuración Local

### 1. Prerrequisitos

- Node.js 20 LTS
- npm/yarn
- Cuenta de Supabase

### 2. Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd lottery-admin-backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 3. Configuración de Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Obtener las credenciales del proyecto:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
3. Configurar variables en `.env`

### 4. Base de Datos

```bash
# Ejecutar migraciones
npm run migrate

# Poblar con datos de prueba
npm run seed
```

### 5. Desarrollo

```bash
# Modo desarrollo (watch)
npm run dev

# Generar documentación OpenAPI
npm run gen:openapi

# Exportar colección Postman
npm run postman:export
```

La API estará disponible en:
- **API**: http://localhost:8080
- **Documentación**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health

## 🐳 Docker

### Desarrollo con Docker

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api
```

### Producción

```bash
# Build
docker build -t lottery-admin-backend .

# Run
docker run -d -p 8080:8080 --env-file .env lottery-admin-backend
```

## 📊 Modelo de Datos

### Entidades Principales

- **usuarios**: Usuarios del sistema con roles (admin, supervisor, operador)
- **bancas**: Puntos de venta/bancas de lotería
- **vendedores**: Empleados que registran jugadas
- **sorteos**: Catálogo de sorteos disponibles (Nacional, Leidsa, Real, etc.)
- **jugadas**: Apuestas registradas por los vendedores
- **resultados**: Números ganadores de cada sorteo
- **auditoria**: Log de todas las operaciones críticas

### Roles y Permisos

- **Admin**: Acceso total al sistema
- **Supervisor**: Lectura global, gestión de vendedores, publicación de resultados
- **Operador**: Lectura limitada a sus bancas, creación de jugadas propias

## 🔐 Seguridad

### Autenticación
- JWT tokens de Supabase
- Verificación de estado del usuario
- Sesiones seguras

### Autorización
- RBAC a nivel de aplicación
- Row Level Security (RLS) en Supabase
- Políticas granulares por tabla

### Protección IP/Geolocalización
- Whitelist de IPs por banca
- Middleware de geofencing (configurable)
- Logs de acceso por IP

### Otras Medidas
- Rate limiting
- Helmet para headers de seguridad
- Validación estricta con Zod
- Sanitización de inputs
- CORS configurado

## 📝 API Endpoints

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Perfil del usuario
- `POST /auth/logout` - Cerrar sesión

### Bancas
- `GET /bancas` - Listar bancas
- `GET /bancas/:id` - Obtener banca
- `POST /bancas` - Crear banca (admin)
- `PATCH /bancas/:id` - Actualizar banca (admin)
- `POST /bancas/:id/activar` - Activar banca (admin)
- `POST /bancas/:id/desactivar` - Desactivar banca (admin)

### Vendedores
- `GET /vendedores` - Listar vendedores
- `GET /vendedores/:id` - Obtener vendedor
- `POST /vendedores` - Crear vendedor (admin/supervisor)
- `PATCH /vendedores/:id` - Actualizar vendedor
- `POST /vendedores/:id/bancas` - Asignar a bancas
- `GET /vendedores/:id/bancas` - Obtener bancas asignadas
- `DELETE /vendedores/:id/bancas/:bancaId` - Remover de banca

### Jugadas
- `GET /jugadas` - Listar jugadas (con filtros)
- `GET /jugadas/:id` - Obtener jugada
- `POST /jugadas` - Crear jugada
- `POST /jugadas/:id/anular` - Anular jugada
- `POST /jugadas/batch` - Crear lote de jugadas

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Tipos de Tests
- **Unit Tests**: Servicios, utilidades, validadores
- **Integration Tests**: Endpoints críticos con base de datos
- **Objetivo**: Cobertura ≥ 80%

## 📈 Monitoreo y Logs

### Logging Estructurado
- Pino para logs JSON estructurados
- Correlación por `x-request-id`
- Diferentes niveles según ambiente

### Auditoría
- Triggers automáticos para cambios críticos
- Log de todas las operaciones CRUD
- Trazabilidad completa de jugadas y resultados

## 🚀 Despliegue

### Variables de Entorno de Producción

```bash
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX=1000
TRUST_PROXY=true
```

### Healthchecks
- Endpoint `/health` para verificar estado
- Verificación de conexión a Supabase
- Métricas de rendimiento

## 🔧 Scripts NPM

- `dev`: Desarrollo con hot reload
- `build`: Compilar TypeScript
- `start`: Iniciar en producción
- `test`: Ejecutar tests
- `lint`: Linter ESLint
- `format`: Prettier
- `migrate`: Ejecutar migraciones
- `seed`: Poblar datos de prueba
- `gen:openapi`: Generar documentación
- `postman:export`: Exportar colección Postman

## 📚 Documentación

### API Documentation
- OpenAPI 3.1 spec en `/docs/openapi.yml`
- Swagger UI en `/docs`
- Colección Postman exportable

### Ejemplos de Uso

```bash
# Registrar nuevo usuario
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"nuevo@ejemplo.com",
    "password":"password123",
    "nombre":"Nuevo Usuario",
    "rol":"operador"
  }'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ejemplo.com","password":"password"}'

# Crear jugada
curl -X POST http://localhost:8080/jugadas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "banca_id":"20000000-0000-4000-8000-000000000001",
    "vendedor_id":"30000000-0000-4000-8000-000000000001",
    "sorteo_id":"10000000-0000-4000-8000-000000000001",
    "numeros":[12,34,56],
    "monto":100
  }'

# Listar jugadas con filtros
curl "http://localhost:8080/jugadas?fecha_desde=2024-01-01&banca_id=20000000-0000-4000-8000-000000000001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Solución de Problemas

### Errores Comunes

1. **Error de conexión a Supabase**
   - Verificar credenciales en `.env`
   - Comprobar conectividad de red

2. **Errores de migración**
   - Verificar permisos de base de datos
   - Revisar sintaxis SQL en migraciones

3. **Errores de autenticación**
   - Verificar configuración de Supabase Auth
   - Comprobar políticas RLS

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Soporte

Para soporte técnico o consultas:
- Email: support@example.com
- Issues: GitHub Issues
- Documentación: `/docs` endpoint

---

**Nota**: Este es un MVP (Producto Mínimo Viable) diseñado para demostrar la funcionalidad core. Para producción, considerar implementar funcionalidades adicionales como cache con Redis, métricas con Prometheus, y deployment automatizado con CI/CD.