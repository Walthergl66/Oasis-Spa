import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Inyecta el perfil de la usuaria autenticada en el controlador.
 *
 * Lo pone `JwtAuthGuard` a partir del `sub` del token, así que un controlador
 * nunca necesita recibir el id del usuario por parámetro ni confiar en el
 * cuerpo de la petición para saber quién está actuando.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
