import { supabase } from '@/config/supabase';
import { Vendedor, CreateVendedor, UpdateVendedor, Pagination } from '@/domain/schemas';
import { NotFoundError, ConflictError } from '@/shared/errors';
import { EstadoVendedor } from '@/domain/types';
import { logger } from '@/config/logger';

export class VendedoresService {
  async create(data: CreateVendedor): Promise<Vendedor> {
    const { data: vendedor, error } = await supabase
      .from('vendedores')
      .insert([data])
      .select()
      .single();

    if (error) {
      logger.error({ error: error.message, data }, 'Error creating vendedor');
      if (error.code === '23505') {
        throw new ConflictError('Ya existe un vendedor con esa cédula');
      }
      throw new Error('Error al crear el vendedor');
    }

    logger.info({ vendedorId: vendedor.id }, 'Vendedor created successfully');
    return vendedor as Vendedor;
  }

  async findAll(
    pagination: Pagination,
    filters: { estado?: EstadoVendedor } = {}
  ): Promise<{ vendedores: Vendedor[]; total: number }> {
    let query = supabase.from('vendedores').select('*', { count: 'exact' });

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
      logger.error({ error: error.message }, 'Error fetching vendedores');
      throw new Error('Error al obtener los vendedores');
    }

    return {
      vendedores: data as Vendedor[],
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Vendedor> {
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.error({ error: error?.message, vendedorId: id }, 'Vendedor not found');
      throw new NotFoundError('Vendedor no encontrado');
    }

    return data as Vendedor;
  }

  async update(id: string, data: UpdateVendedor): Promise<Vendedor> {
    const { data: vendedor, error } = await supabase
      .from('vendedores')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !vendedor) {
      logger.error({ error: error?.message, vendedorId: id }, 'Error updating vendedor');
      throw new NotFoundError('Vendedor no encontrado');
    }

    logger.info({ vendedorId: id }, 'Vendedor updated successfully');
    return vendedor as Vendedor;
  }

  async assignToBancas(vendedorId: string, bancaIds: string[]): Promise<void> {
    // Remove existing assignments
    await supabase
      .from('bancas_vendedores')
      .delete()
      .eq('vendedor_id', vendedorId);

    // Add new assignments
    const assignments = bancaIds.map(bancaId => ({
      vendedor_id: vendedorId,
      banca_id: bancaId,
    }));

    const { error } = await supabase
      .from('bancas_vendedores')
      .insert(assignments);

    if (error) {
      logger.error({ error: error.message, vendedorId, bancaIds }, 'Error assigning vendedor to bancas');
      throw new Error('Error al asignar vendedor a bancas');
    }

    logger.info({ vendedorId, bancaIds }, 'Vendedor assigned to bancas successfully');
  }

  async getBancas(vendedorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('bancas_vendedores')
      .select(`
        banca_id,
        bancas (*)
      `)
      .eq('vendedor_id', vendedorId);

    if (error) {
      logger.error({ error: error.message, vendedorId }, 'Error fetching vendedor bancas');
      throw new Error('Error al obtener las bancas del vendedor');
    }

    return data?.map(item => item.bancas) || [];
  }

  async removeBanca(vendedorId: string, bancaId: string): Promise<void> {
    const { error } = await supabase
      .from('bancas_vendedores')
      .delete()
      .eq('vendedor_id', vendedorId)
      .eq('banca_id', bancaId);

    if (error) {
      logger.error({ error: error.message, vendedorId, bancaId }, 'Error removing vendedor from banca');
      throw new Error('Error al remover vendedor de la banca');
    }

    logger.info({ vendedorId, bancaId }, 'Vendedor removed from banca successfully');
  }
}