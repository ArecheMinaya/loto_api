import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { Role } from '@/domain/types';
import { AuthorizationError } from '@/shared/errors';

export function rbac(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthorizationError('Usuario no autenticado'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Rol ${req.user.role} no autorizado para esta acción`));
    }

    next();
  };
}

// Shortcuts para roles comunes
export const adminOnly = rbac([Role.ADMIN]);
export const adminOrSupervisor = rbac([Role.ADMIN, Role.SUPERVISOR]);
export const allRoles = rbac([Role.ADMIN, Role.SUPERVISOR, Role.OPERADOR]);