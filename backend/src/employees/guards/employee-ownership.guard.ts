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
import { Employee } from '../entities/employee.entity';

@Injectable()
export class EmployeeOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
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

    const bodySpaId =
      typeof request.body?.spaId === 'string' ? (request.body.spaId as string) : undefined;

    const spaIdFromEmployee = async (employeeId: string): Promise<string> => {
      const employee = await this.employeesRepository.findOne({
        where: { id: employeeId },
        select: { id: true, spaId: true },
      });
      if (!employee) throw new ForbiddenException('Employee not found');
      return employee.spaId;
    };

    const spaId =
      bodySpaId ??
      (request.params?.id ? await spaIdFromEmployee(request.params.id as string) : undefined);

    if (!spaId) {
      throw new ForbiddenException('spaId is required');
    }

    const spa = await this.spasRepository.findOne({
      where: { id: spaId },
      select: { id: true, ownerId: true },
    });
    if (!spa) throw new ForbiddenException('Spa not found');

    if (profile.role === UserRole.ADMIN && spa.ownerId === profile.id) return true;

    throw new ForbiddenException('You do not own this spa');
  }
}

