import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtVerifierService } from '../jwt-verifier.service';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Valida el access token de Supabase Auth y carga el perfil correspondiente.
 *
 * La verificación es local (firma + expiración): no se consulta a GoTrue en
 * cada petición, lo que costaría una llamada de red por request.
 *
 * El ROL nunca se lee del token, sino de la tabla `users`. Es deliberado: si el
 * administrador revoca permisos a alguien, el cambio surte efecto en la
 * siguiente petición y no cuando caduque su token una hora después.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: JwtVerifierService,
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

    const payload = await this.verifier.verify(token);

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('La cuenta no tiene un perfil asociado.');
    }
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
