import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Comprueba el rol del perfil cargado por `JwtAuthGuard`.
 *
 * Sin `@Roles(...)` el endpoint queda disponible para cualquier sesión válida.
 * La distinción importa: autenticar es saber quién eres; autorizar es saber qué
 * puedes hacer, y son dos guards separados por eso.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('No tienes permiso para esta operación.');
    }
    return true;
  }
}
