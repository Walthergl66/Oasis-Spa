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
import { Appointment } from '../entities/appointment.entity';
import { Spa } from '../../spas/entities/spa.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Injectable()
export class AppointmentAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Spa)
    private readonly spasRepository: Repository<Spa>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const profile = request.profile;

    if (!profile) {
      throw new ForbiddenException('Authorization context is missing');
    }

    if (profile.role === UserRole.SUPER_ADMIN) return true;

    const appointmentId = request.params?.id as string | undefined;
    if (!appointmentId) {
      throw new ForbiddenException('Appointment id is required');
    }

    const appt = await this.appointmentsRepository.findOne({
      where: { id: appointmentId },
      select: { id: true, customerId: true, spaId: true, employeeId: true },
    });

    if (!appt) {
      throw new ForbiddenException('Appointment not found');
    }

    // Customer can access own appointment
    if (appt.customerId === profile.id) return true;

    // Spa owner (admin) can access appointments of their spa
    if (profile.role === UserRole.ADMIN) {
      const spa = await this.spasRepository.findOne({
        where: { id: appt.spaId },
        select: { id: true, ownerId: true },
      });
      if (spa?.ownerId === profile.id) return true;
    }

    // Employee can access appointments assigned to them (by userId)
    if (profile.role === UserRole.EMPLOYEE && appt.employeeId) {
      const employee = await this.employeesRepository.findOne({
        where: { id: appt.employeeId },
        select: { id: true, userId: true },
      });
      if (employee?.userId === profile.id) return true;
    }

    throw new ForbiddenException('You do not have access to this appointment');
  }
}

