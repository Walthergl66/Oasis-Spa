import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { User } from '../../users/entities/user.entity';

export const CurrentProfile = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const profile = request.profile;

    if (!profile) {
      throw new InternalServerErrorException(
        'CurrentProfile decorator requires RolesGuard',
      );
    }

    return data ? profile[data] : profile;
  },
);

