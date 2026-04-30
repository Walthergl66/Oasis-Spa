import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { SupabaseAuthenticatedUser } from '../interfaces/supabase-user.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof SupabaseAuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException(
        'CurrentUser decorator requires SupabaseAuthGuard',
      );
    }

    return data ? user[data] : user;
  },
);
