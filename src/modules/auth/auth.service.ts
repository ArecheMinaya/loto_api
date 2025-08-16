import { supabase, supabaseAuth } from '@/config/supabase';
import { AuthenticationError, NotFoundError } from '@/shared/errors';
import { Usuario } from '@/domain/schemas';
import { logger } from '@/config/logger';

export class AuthService {
  async getProfile(userId: string): Promise<Usuario> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      logger.error({ error: error?.message, userId }, 'Error fetching user profile');
      throw new NotFoundError('Usuario no encontrado');
    }

    return data as Usuario;
  }

  async login(email: string, password: string): Promise<{ user: any; session: any }> {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn({ error: error.message, email }, 'Login failed');
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Check user status in our usuarios table
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('estado')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      throw new AuthenticationError('Usuario no encontrado en el sistema');
    }

    if (userData.estado === 'inactivo') {
      throw new AuthenticationError('Usuario inactivo');
    }

    logger.info({ userId: data.user.id }, 'User logged in successfully');

    return data;
  }

  async logout(token: string): Promise<void> {
    const { error } = await supabaseAuth.auth.signOut();
    
    if (error) {
      logger.error({ error: error.message }, 'Logout error');
      throw new AuthenticationError('Error al cerrar sesión');
    }

    logger.info('User logged out successfully');
  }
}