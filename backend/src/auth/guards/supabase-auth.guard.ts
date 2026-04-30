import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseAuthenticatedUser } from '../interfaces/supabase-user.interface';
import { SupabaseAuthService } from '../supabase-auth.service';

type AuthenticatedRequest = Request & {
  user?: SupabaseAuthenticatedUser;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    const user = this.supabaseAuthService.verifyAccessToken(token);

    request.user = user;

    return true;
  }

  private extractBearerToken(request: Request): string {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return token;
  }
}
