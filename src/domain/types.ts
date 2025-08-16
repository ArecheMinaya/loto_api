// Enums y tipos principales del dominio

export enum Role {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  OPERADOR = 'operador'
}

export enum EstadoUsuario {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo'
}

export enum EstadoBanca {
  ACTIVA = 'activa',
  INACTIVA = 'inactiva'
}

export enum EstadoVendedor {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo'
}

export enum EstadoJugada {
  VALIDA = 'valida',
  ANULADA = 'anulada'
}

export enum FuenteResultado {
  MANUAL = 'manual',
  AUTOMATICO = 'automatico'
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  filters?: Record<string, any>;
}

export interface RequestUser {
  id: string;
  email: string;
  role: Role;
  estado: EstadoUsuario;
}