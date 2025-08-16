import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '@/config/supabase';
import { AuthenticationError } from '@/shared/errors';
import { RequestUser, Role, EstadoUsuario } from '@/domain/types';
import { logger } from '@/config/logger';

interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

export async function authGuard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Token requerido');
    }

    const token = authHeader.substring(7);
    
    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new AuthenticationError('Token inválido');
    }

    // Obtener datos del usuario desde nuestra tabla
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol, estado')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new AuthenticationError('Usuario no encontrado');
    }

    if (userData.estado === EstadoUsuario.INACTIVO) {
      throw new AuthenticationError('Usuario inactivo');
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.rol as Role,
      estado: userData.estado as EstadoUsuario,
    };

    logger.info({ userId: req.user.id, role: req.user.role }, 'Usuario autenticado');
    
    next();
  } catch (error) {
    next(error);
  }
}

export { AuthenticatedRequest };