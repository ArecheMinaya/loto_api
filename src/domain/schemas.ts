import { z } from 'zod';
import { Role, EstadoUsuario, EstadoBanca, EstadoVendedor, EstadoJugada, FuenteResultado } from './types';

// Schemas de validación con Zod

// Usuario
export const UsuarioSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nombre: z.string().min(2).max(100),
  rol: z.nativeEnum(Role),
  estado: z.nativeEnum(EstadoUsuario),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateUsuarioSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2).max(100),
  rol: z.nativeEnum(Role),
  estado: z.nativeEnum(EstadoUsuario).default(EstadoUsuario.ACTIVO),
});

// Banca
export const BancaSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(2).max(100),
  ubicacion: z.string().min(5).max(200),
  estado: z.nativeEnum(EstadoBanca),
  ip_whitelist: z.array(z.string().ip()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateBancaSchema = z.object({
  nombre: z.string().min(2).max(100),
  ubicacion: z.string().min(5).max(200),
  estado: z.nativeEnum(EstadoBanca).default(EstadoBanca.ACTIVA),
  ip_whitelist: z.array(z.string().ip()).optional(),
});

export const UpdateBancaSchema = CreateBancaSchema.partial();

// Vendedor
export const VendedorSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(2).max(100),
  cedula: z.string().regex(/^\d{11}$/, 'Cédula debe tener 11 dígitos'),
  telefono: z.string().regex(/^\+?1?[-()\s\d]{10,15}$/, 'Formato de teléfono inválido'),
  estado: z.nativeEnum(EstadoVendedor),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateVendedorSchema = z.object({
  nombre: z.string().min(2).max(100),
  cedula: z.string().regex(/^\d{11}$/, 'Cédula debe tener 11 dígitos'),
  telefono: z.string().regex(/^\+?1?[-()\s\d]{10,15}$/, 'Formato de teléfono inválido'),
  estado: z.nativeEnum(EstadoVendedor).default(EstadoVendedor.ACTIVO),
});

export const UpdateVendedorSchema = CreateVendedorSchema.partial();

// Sorteo
export const SorteoSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(2).max(50),
  codigo: z.string().regex(/^[a-z0-9-]+$/, 'Código debe ser lowercase con guiones'),
  horario: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM')).optional(),
  activo: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateSorteoSchema = z.object({
  nombre: z.string().min(2).max(50),
  codigo: z.string().regex(/^[a-z0-9-]+$/, 'Código debe ser lowercase con guiones'),
  horario: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM')).optional(),
  activo: z.boolean().default(true),
});

// Resultado
export const ResultadoSchema = z.object({
  id: z.string().uuid(),
  sorteo_id: z.string().uuid(),
  fecha: z.string().date(),
  numeros: z.array(z.number().int().min(0).max(99)),
  fuente: z.nativeEnum(FuenteResultado),
  publicado: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateResultadoSchema = z.object({
  sorteo_id: z.string().uuid(),
  fecha: z.string().date(),
  numeros: z.array(z.number().int().min(0).max(99)).min(1),
  fuente: z.nativeEnum(FuenteResultado).default(FuenteResultado.MANUAL),
});

// Jugada
export const JugadaSchema = z.object({
  id: z.string().uuid(),
  banca_id: z.string().uuid(),
  vendedor_id: z.string().uuid(),
  sorteo_id: z.string().uuid(),
  fecha_hora: z.string().datetime(),
  numeros: z.array(z.number().int().min(0).max(99)),
  monto: z.number().positive(),
  estado: z.nativeEnum(EstadoJugada),
  premio: z.number().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateJugadaSchema = z.object({
  banca_id: z.string().uuid(),
  vendedor_id: z.string().uuid(),
  sorteo_id: z.string().uuid(),
  numeros: z.array(z.number().int().min(0).max(99)).min(1),
  monto: z.number().positive(),
});

// Paginación
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Filtros comunes
export const DateRangeSchema = z.object({
  fecha_desde: z.string().date().optional(),
  fecha_hasta: z.string().date().optional(),
});

export const SortSchema = z.object({
  sort: z.string().regex(/^[a-zA-Z_]+:(asc|desc)$/).optional(),
});

// Export tipos inferidos
export type Usuario = z.infer<typeof UsuarioSchema>;
export type CreateUsuario = z.infer<typeof CreateUsuarioSchema>;
export type Banca = z.infer<typeof BancaSchema>;
export type CreateBanca = z.infer<typeof CreateBancaSchema>;
export type UpdateBanca = z.infer<typeof UpdateBancaSchema>;
export type Vendedor = z.infer<typeof VendedorSchema>;
export type CreateVendedor = z.infer<typeof CreateVendedorSchema>;
export type UpdateVendedor = z.infer<typeof UpdateVendedorSchema>;
export type Sorteo = z.infer<typeof SorteoSchema>;
export type CreateSorteo = z.infer<typeof CreateSorteoSchema>;
export type Resultado = z.infer<typeof ResultadoSchema>;
export type CreateResultado = z.infer<typeof CreateResultadoSchema>;
export type Jugada = z.infer<typeof JugadaSchema>;
export type CreateJugada = z.infer<typeof CreateJugadaSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Sort = z.infer<typeof SortSchema>;