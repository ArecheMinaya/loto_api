import { supabase } from '@/config/supabase';
import { Jugada, CreateJugada, Pagination, DateRange } from '@/domain/schemas';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { EstadoJugada, EstadoBanca, EstadoVendedor } from '@/domain/types';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

export class JugadasService {
  async create(data: CreateJugada): Promise<Jugada> {
    // Validate banca is active
    const { data: banca, error: bancaError } = await supabase
      .from('bancas')
      .select('estado')
      .eq('id', data.banca_id)
      .single();

    if (bancaError || !banca) {
      throw new ValidationError('Banca no encontrada');
    }

    if (banca.estado !== EstadoBanca.ACTIVA) {
      throw new ValidationError('La banca debe estar activa para registrar jugadas');
    }

    // Validate vendedor is active and assigned to banca
    const { data: vendedor, error: vendedorError } = await supabase
      .from('vendedores')
      .select('estado')
      .eq('id', data.vendedor_id)
      .single();

    if (vendedorError || !vendedor) {
      throw new ValidationError('Vendedor no encontrado');
    }

    if (vendedor.estado !== EstadoVendedor.ACTIVO) {
      throw new ValidationError('El vendedor debe estar activo para registrar jugadas');
    }

    // Check vendedor is assigned to banca
    const { data: assignment } = await supabase
      .from('bancas_vendedores')
      .select('id')
      .eq('vendedor_id', data.vendedor_id)
      .eq('banca_id', data.banca_id)
      .single();

    if (!assignment) {
      throw new ValidationError('El vendedor no está asignado a esta banca');
    }

    // Create jugada
    const jugadaData = {
      ...data,
      fecha_hora: new Date().toISOString(),
      estado: EstadoJugada.VALIDA,
      premio: 0,
    };

    const { data: jugada, error } = await supabase
      .from('jugadas')
      .insert([jugadaData])
      .select()
      .single();

    if (error) {
      logger.error({ error: error.message, data }, 'Error creating jugada');
      throw new Error('Error al crear la jugada');
    }

    logger.info({ jugadaId: jugada.id }, 'Jugada created successfully');
    return jugada as Jugada;
  }

  async findAll(
    pagination: Pagination,
    filters: {
      fecha_desde?: string;
      fecha_hasta?: string;
      banca_id?: string;
      vendedor_id?: string;
      sorteo_id?: string;
      estado?: EstadoJugada;
      numero?: number;
    } = {}
  ): Promise<{ jugadas: Jugada[]; total: number }> {
    let query = supabase.from('jugadas').select(`
      *,
      bancas (nombre),
      vendedores (nombre),
      sorteos (nombre, codigo)
    `, { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'fecha_desde') {
          query = query.gte('fecha_hora', value);
        } else if (key === 'fecha_hasta') {
          query = query.lte('fecha_hora', value);
        } else if (key === 'numero') {
          query = query.contains('numeros', [value]);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order('fecha_hora', { ascending: false });

    if (error) {
      logger.error({ error: error.message }, 'Error fetching jugadas');
      throw new Error('Error al obtener las jugadas');
    }

    return {
      jugadas: data as any[],
      total: count || 0,
    };
  }

  async findById(id: string): Promise<Jugada> {
    const { data, error } = await supabase
      .from('jugadas')
      .select(`
        *,
        bancas (nombre, ubicacion),
        vendedores (nombre, cedula),
        sorteos (nombre, codigo)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.error({ error: error?.message, jugadaId: id }, 'Jugada not found');
      throw new NotFoundError('Jugada no encontrada');
    }

    return data as any;
  }

  async anular(id: string): Promise<Jugada> {
    // Check if jugada exists and is valid
    const jugada = await this.findById(id);

    if (jugada.estado === EstadoJugada.ANULADA) {
      throw new ValidationError('La jugada ya está anulada');
    }

    // Check time window
    const jugadaTime = new Date(jugada.fecha_hora);
    const now = new Date();
    const diffMinutes = (now.getTime() - jugadaTime.getTime()) / (1000 * 60);

    if (diffMinutes > env.ANULACION_MINUTOS) {
      throw new ValidationError(`No se puede anular la jugada después de ${env.ANULACION_MINUTOS} minutos`);
    }

    // Check if result is already published for this sorteo and date
    const jugadaDate = jugadaTime.toISOString().split('T')[0];
    const { data: resultado } = await supabase
      .from('resultados')
      .select('publicado')
      .eq('sorteo_id', jugada.sorteo_id)
      .eq('fecha', jugadaDate)
      .single();

    if (resultado?.publicado) {
      throw new ValidationError('No se puede anular la jugada porque el resultado ya fue publicado');
    }

    // Update jugada
    const { data: updatedJugada, error } = await supabase
      .from('jugadas')
      .update({
        estado: EstadoJugada.ANULADA,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error({ error: error.message, jugadaId: id }, 'Error anulando jugada');
      throw new Error('Error al anular la jugada');
    }

    logger.info({ jugadaId: id }, 'Jugada anulada successfully');
    return updatedJugada as Jugada;
  }

  async createBatch(jugadas: CreateJugada[]): Promise<Jugada[]> {
    // Validate all jugadas before creating
    for (const jugada of jugadas) {
      // Validate banca and vendedor (simplified validation)
      const { data: banca } = await supabase
        .from('bancas')
        .select('estado')
        .eq('id', jugada.banca_id)
        .single();

      if (!banca || banca.estado !== EstadoBanca.ACTIVA) {
        throw new ValidationError(`Banca ${jugada.banca_id} no válida`);
      }
    }

    const jugadasData = jugadas.map(jugada => ({
      ...jugada,
      fecha_hora: new Date().toISOString(),
      estado: EstadoJugada.VALIDA,
      premio: 0,
    }));

    const { data, error } = await supabase
      .from('jugadas')
      .insert(jugadasData)
      .select();

    if (error) {
      logger.error({ error: error.message }, 'Error creating batch jugadas');
      throw new Error('Error al crear las jugadas en lote');
    }

    logger.info({ count: data.length }, 'Batch jugadas created successfully');
    return data as Jugada[];
  }
}