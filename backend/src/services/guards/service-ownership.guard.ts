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
import { Spa } from '../../spas/entities/spa.entity';
import { Service } from '../entities/service.entity';

@Injectable()
export class ServiceOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
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

    // For create/update with spaId in body
    const bodySpaId =
      typeof request.body?.spaId === 'string' ? (request.body.spaId as string) : undefined;
    if (bodySpaId) {
      const spa = await this.spasRepository.findOne({
        where: { id: bodySpaId },
        select: { id: true, ownerId: true },
      });

      if (!spa) throw new ForbiddenException('Spa not found');
      if (spa.ownerId !== profile.id) {
        throw new ForbiddenException('You do not own this spa');
      }

      return true;
    }

    // For update/delete by service id param
    const serviceId = request.params?.id as string | undefined;
    if (!serviceId) {
      throw new ForbiddenException('Service id is required');
    }

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      select: { id: true, spaId: true },
    });

    if (!service) throw new ForbiddenException('Service not found');

    const spa = await this.spasRepository.findOne({
      where: { id: service.spaId },
      select: { id: true, ownerId: true },
    });

    if (!spa) throw new ForbiddenException('Spa not found');
    if (spa.ownerId !== profile.id) {
      throw new ForbiddenException('You do not own this spa');
    }

    return true;
  }
}

