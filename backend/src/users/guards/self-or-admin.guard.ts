import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/database.enums';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const profile = request.profile;

    if (!profile) {
      throw new ForbiddenException('Authorization context is missing');
    }

    if (profile.role === UserRole.SUPER_ADMIN || profile.role === UserRole.ADMIN) {
      return true;
    }

    const paramId = request.params?.id as string | undefined;
    if (!paramId) {
      throw new ForbiddenException('User id is required');
    }

    if (paramId !== profile.id) {
      throw new ForbiddenException('You can only access your own user');
    }

    return true;
  }
}

