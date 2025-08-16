import { supabase } from '@/config/supabase';
import { Banca, CreateBanca, UpdateBanca, Pagination } from '@/domain/schemas';
import { NotFoundError, ConflictError } from '@/shared/errors';
import { EstadoBanca } from '@/domain/types';
import { logger } from '@/config/logger';

export class BancasService {
  async create(data: CreateBanca): Promise<Banca> {
    const { data: banca, error } = await supabase
      .from('bancas')
      .insert([data])
      .select()
      .single();

    if (error) {
      logger.error({ error: error.message, data }, 'Error creating banca');
      if (error.code === '23505') {
        throw new ConflictError('Ya existe una banca con ese nombre');
      }
      throw new Error('Error al crear la banca');
    }

    logger.info({ bancaId: banca.id }, 'Banca created successfully');
    return banca as Banca;
  }

  async findAll(
    pagination: Pagination,
    filters: { estado?: EstadoBanca } = {}
  ): Promise<{ bancas: Banca[]; total: number }> {
    let query = supabase.from('bancas').select('*', { count: 'exact' });

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error: error.message }, 'Error fetching bancas');
      throw new Error('Error al obtener las bancas');
    }

    return {
      bancas: data as Banca[],
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Banca> {
    const { data, error } = await supabase
      .from('bancas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.error({ error: error?.message, bancaId: id }, 'Banca not found');
      throw new NotFoundError('Banca no encontrada');
    }

    return data as Banca;
  }

  async update(id: string, data: UpdateBanca): Promise<Banca> {
    const { data: banca, error } = await supabase
      .from('bancas')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !banca) {
      logger.error({ error: error?.message, bancaId: id }, 'Error updating banca');
      throw new NotFoundError('Banca no encontrada');
    }

    logger.info({ bancaId: id }, 'Banca updated successfully');
    return banca as Banca;
  }

  async activate(id: string): Promise<Banca> {
    return this.update(id, { estado: EstadoBanca.ACTIVA });
  }

  async deactivate(id: string): Promise<Banca> {
    return this.update(id, { estado: EstadoBanca.INACTIVA });
  }
}