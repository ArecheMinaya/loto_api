import { supabase, supabaseAuth } from '@/config/supabase';
import { AuthenticationError, NotFoundError, ValidationError } from '@/shared/errors';
import { Usuario, RegisterUsuario } from '@/domain/schemas';
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

  async register(userData: RegisterUsuario): Promise<{ user: any; session: any }> {
    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      throw new ValidationError('El email ya está registrado');
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nombre: userData.nombre,
          rol: userData.rol,
        },
      },
    });

    if (authError) {
      logger.error({ error: authError.message, email: userData.email }, 'Registration failed');
      throw new ValidationError(`Error al registrar usuario: ${authError.message}`);
    }

    if (!authData.user) {
      throw new ValidationError('Error al crear el usuario');
    }

    // El trigger handle_new_user() debería crear automáticamente el registro en la tabla usuarios
    // pero verificamos que se haya creado correctamente
    const { data: userRecord, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userRecord) {
      // Si no se creó automáticamente, lo creamos manualmente
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: userData.email,
          nombre: userData.nombre,
          rol: userData.rol,
          estado: 'activo',
        });

      if (insertError) {
        logger.error({ error: insertError.message, userId: authData.user.id }, 'Error creating user record');
        throw new ValidationError('Error al crear el perfil del usuario');
      }
    }

    logger.info({ userId: authData.user.id, email: userData.email }, 'User registered successfully');

    return {
      user: authData.user,
      session: authData.session,
    };
  }
}