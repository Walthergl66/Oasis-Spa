import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import type { AccessTokenPayload } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Valida el access token y carga el perfil correspondiente.
 *
 * El ROL no viaja en el token, se lee de la tabla `users` en cada petición. Es
 * deliberado: si la administración revoca permisos a alguien, el cambio surte
 * efecto en la siguiente llamada y no cuando caduque su token. El coste es una
 * consulta por id —indexada— a cambio de poder revocar de inmediato.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Falta el token de acceso.');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch (error) {
      const expirado =
        error instanceof Error && error.name === 'TokenExpiredError';
      throw new UnauthorizedException(
        expirado ? 'La sesión expiró.' : 'Token de acceso no válido.',
      );
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('La cuenta no existe.');
    if (!user.active) {
      throw new UnauthorizedException('Esta cuenta está desactivada.');
    }

    request.user = user;
    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
