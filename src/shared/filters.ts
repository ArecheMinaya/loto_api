import { DateRange, Sort } from '@/domain/schemas';

export function buildDateFilter(dateRange: DateRange): string {
  const conditions: string[] = [];
  
  if (dateRange.fecha_desde) {
    conditions.push(`fecha >= '${dateRange.fecha_desde}'`);
  }
  
  if (dateRange.fecha_hasta) {
    conditions.push(`fecha <= '${dateRange.fecha_hasta}'`);
  }
  
  return conditions.length > 0 ? conditions.join(' AND ') : '';
}

export function buildSortClause(sort?: Sort['sort']): string {
  if (!sort) return 'created_at desc';
  
  const [field, direction] = sort.split(':');
  return `${field} ${direction}`;
}

export function sanitizeString(value: string): string {
  return value.replace(/['"\\]/g, '');
}