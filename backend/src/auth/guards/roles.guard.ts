import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/database.enums';
import { User } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.CUSTOMER]: 1,
  [UserRole.EMPLOYEE]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authUser = request.user;

    if (!authUser?.id) {
      throw new ForbiddenException('Authentication is required');
    }

    const profile =
      request.profile ??
      (await this.usersRepository.findOne({ where: { id: authUser.id } }));

    // Auto-sync minimal local profile on first authenticated request.
    // This keeps identity centered in Supabase while ensuring the app has a local profile row.
    const resolvedProfile =
      profile ??
      (await this.usersRepository.save(
        this.usersRepository.create({
          id: authUser.id,
          fullName:
            (typeof authUser.userMetadata?.full_name === 'string' &&
            authUser.userMetadata.full_name.trim().length > 0
              ? authUser.userMetadata.full_name.trim()
              : undefined) ??
            authUser.email?.split('@')[0] ??
            'Oasis Spa User',
          phone: authUser.phone ?? null,
          avatarUrl:
            typeof authUser.userMetadata?.avatar_url === 'string'
              ? authUser.userMetadata.avatar_url
              : null,
          role: UserRole.CUSTOMER,
          isActive: true,
        }),
      ));

    if (!resolvedProfile.isActive) {
      throw new ForbiddenException('User is inactive');
    }

    request.profile = resolvedProfile;

    const userRank = ROLE_RANK[resolvedProfile.role] ?? 0;
    const minRequiredRank = Math.min(
      ...requiredRoles.map((role) => ROLE_RANK[role] ?? Number.MAX_SAFE_INTEGER),
    );

    if (userRank < minRequiredRank) {
      throw new ForbiddenException('Insufficient role permissions');
    }

    return true;
  }
}

