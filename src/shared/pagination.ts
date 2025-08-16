import { PaginationMeta, ApiResponse } from '@/domain/types';
import { Pagination } from '@/domain/schemas';

export function createPaginationMeta(
  pagination: Pagination,
  total: number
): PaginationMeta {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export function createResponse<T>(
  data: T,
  meta?: PaginationMeta,
  filters?: Record<string, any>
): ApiResponse<T> {
  return {
    data,
    ...(meta && { meta }),
    ...(filters && { filters }),
  };
}

export function applyPagination<T>(
  items: T[],
  pagination: Pagination
): T[] {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  return items.slice(offset, offset + limit);
}