import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/database.enums';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { Spa } from '../entities/spa.entity';

@Injectable()
export class SpaOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Spa)
    private readonly spasRepository: Repository<Spa>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const profile = request.profile;
    if (!profile) {
      throw new ForbiddenException('Authorization context is missing');
    }

    if (profile.role === UserRole.SUPER_ADMIN) return true;

    const spaId = request.params?.id as string | undefined;
    if (!spaId) {
      throw new ForbiddenException('Spa id is required');
    }

    const spa = await this.spasRepository.findOne({
      where: { id: spaId },
      select: { id: true, ownerId: true },
    });

    if (!spa) {
      throw new ForbiddenException('Spa not found');
    }

    if (spa.ownerId !== profile.id) {
      throw new ForbiddenException('You do not own this spa');
    }

    return true;
  }
}

