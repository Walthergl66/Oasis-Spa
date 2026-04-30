import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { AppointmentStatus } from '../common/enums/database.enums';
import { Employee } from '../employees/entities/employee.entity';
import { Service } from '../services/entities/service.entity';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentPublicDto } from './dto/create-appointment-public.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentPublicDto } from './dto/update-appointment-public.dto';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService extends BaseCrudService<Appointment> {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Spa)
    private readonly spasRepository: Repository<Spa>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
  ) {
    super(appointmentsRepository, 'Appointment');
  }

  async createPublic(profile: User, dto: CreateAppointmentPublicDto) {
    if (!profile.isActive) {
      throw new ForbiddenException('User is inactive');
    }

    const [spa, service, employee] = await Promise.all([
      this.spasRepository.findOne({ where: { id: dto.spaId }, select: { id: true } }),
      this.servicesRepository.findOne({
        where: { id: dto.serviceId },
        select: { id: true, spaId: true, durationMinutes: true, price: true },
      }),
      dto.employeeId
        ? this.employeesRepository.findOne({
            where: { id: dto.employeeId },
            select: { id: true, spaId: true },
          })
        : Promise.resolve(null),
    ]);

    if (!spa) throw new BadRequestException('Spa not found');
    if (!service) throw new BadRequestException('Service not found');
    if (service.spaId !== dto.spaId) {
      throw new BadRequestException('Service does not belong to the spa');
    }
    if (employee && employee.spaId !== dto.spaId) {
      throw new BadRequestException('Employee does not belong to the spa');
    }

    const startMinutes = this.timeToMinutes(dto.startTime);
    const endMinutes = startMinutes + service.durationMinutes;
    const endTime = this.minutesToTime(endMinutes);

    await this.ensureNoOverlap({
      appointmentDate: dto.appointmentDate,
      startTime: dto.startTime,
      endTime,
      employeeId: dto.employeeId ?? null,
      spaId: dto.spaId,
    });

    return super.create({
      customerId: profile.id,
      spaId: dto.spaId,
      serviceId: dto.serviceId,
      employeeId: dto.employeeId ?? undefined,
      appointmentDate: dto.appointmentDate,
      startTime: dto.startTime,
      endTime,
      notes: dto.notes ?? undefined,
      // internal fields enforced server-side
      status: AppointmentStatus.PENDING,
      finalPrice: service.price,
      bookedByAi: false,
    });
  }

  async createAdmin(createAppointmentDto: CreateAppointmentDto) {
    const [spa, service, employee] = await Promise.all([
      this.spasRepository.findOne({ where: { id: createAppointmentDto.spaId } }),
      this.servicesRepository.findOne({ where: { id: createAppointmentDto.serviceId } }),
      createAppointmentDto.employeeId
        ? this.employeesRepository.findOne({ where: { id: createAppointmentDto.employeeId } })
        : Promise.resolve(null),
    ]);

    if (!spa) throw new BadRequestException('Spa not found');
    if (!service) throw new BadRequestException('Service not found');
    if (service.spaId !== createAppointmentDto.spaId) {
      throw new BadRequestException('Service does not belong to the spa');
    }
    if (employee && employee.spaId !== createAppointmentDto.spaId) {
      throw new BadRequestException('Employee does not belong to the spa');
    }

    if (this.timeToMinutes(createAppointmentDto.endTime) <= this.timeToMinutes(createAppointmentDto.startTime)) {
      throw new BadRequestException('endTime must be after startTime');
    }

    await Promise.all([
      this.ensureExists(this.usersRepository, createAppointmentDto.customerId, 'User'),
      this.ensureNoOverlap({
        appointmentDate: createAppointmentDto.appointmentDate,
        startTime: createAppointmentDto.startTime,
        endTime: createAppointmentDto.endTime,
        employeeId: createAppointmentDto.employeeId ?? null,
        spaId: createAppointmentDto.spaId,
      }),
    ]);

    // Enforce server-side defaults unless explicitly set by admin dto
    if (!createAppointmentDto.finalPrice) createAppointmentDto.finalPrice = service.price;
    return super.create(createAppointmentDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['customer', 'spa', 'service', 'employee', 'payments', 'review'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMine(profile: User) {
    if (profile.role === 'customer') {
      return this.appointmentsRepository.find({
        where: { customerId: profile.id },
        relations: ['spa', 'service', 'employee', 'payments', 'review'],
        order: { createdAt: 'DESC' },
      });
    }

    // employee: list appointments for employee profiles
    if (profile.role === 'employee') {
      const employeeProfiles = await this.employeesRepository.find({
        where: { userId: profile.id },
        select: { id: true },
      });
      const ids = employeeProfiles.map((e) => e.id);
      if (ids.length === 0) return [];
      return this.appointmentsRepository.find({
        where: { employeeId: ids as any },
        relations: ['customer', 'spa', 'service', 'payments', 'review'],
        order: { createdAt: 'DESC' },
      });
    }

    // admin/super_admin: return all (admin already protected at controller)
    return this.findAll();
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: [
        'customer',
        'spa',
        'service',
        'employee',
        'payments',
        'review',
        'notifications',
      ],
    });
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const existing = await this.appointmentsRepository.findOne({
      where: { id },
      select: { id: true, spaId: true, serviceId: true, employeeId: true, appointmentDate: true, startTime: true, endTime: true },
    });
    if (!existing) {
      return super.update(id, updateAppointmentDto);
    }

    const spaId = updateAppointmentDto.spaId ?? existing.spaId;
    const serviceId = updateAppointmentDto.serviceId ?? existing.serviceId;
    const employeeId =
      updateAppointmentDto.employeeId === undefined
        ? existing.employeeId
        : (updateAppointmentDto.employeeId as any);

    const [spa, service, employee] = await Promise.all([
      this.spasRepository.findOne({ where: { id: spaId }, select: { id: true } }),
      this.servicesRepository.findOne({
        where: { id: serviceId },
        select: { id: true, spaId: true, durationMinutes: true, price: true },
      }),
      employeeId
        ? this.employeesRepository.findOne({ where: { id: employeeId }, select: { id: true, spaId: true } })
        : Promise.resolve(null),
    ]);

    if (!spa) throw new BadRequestException('Spa not found');
    if (!service) throw new BadRequestException('Service not found');
    if (service.spaId !== spaId) {
      throw new BadRequestException('Service does not belong to the spa');
    }
    if (employee && employee.spaId !== spaId) {
      throw new BadRequestException('Employee does not belong to the spa');
    }

    const appointmentDate = updateAppointmentDto.appointmentDate ?? existing.appointmentDate;
    const startTime = updateAppointmentDto.startTime ?? existing.startTime;
    const endTime = updateAppointmentDto.endTime ?? existing.endTime;

    if (this.timeToMinutes(endTime) <= this.timeToMinutes(startTime)) {
      throw new BadRequestException('endTime must be after startTime');
    }

    await this.ensureNoOverlap({
      appointmentDate,
      startTime,
      endTime,
      employeeId: employeeId ?? null,
      spaId,
      excludeAppointmentId: id,
    });

    return super.update(id, updateAppointmentDto);
  }

  async updatePublic(id: string, profile: User, dto: UpdateAppointmentPublicDto) {
    const existing = await this.appointmentsRepository.findOne({
      where: { id },
      select: { id: true, customerId: true, spaId: true, serviceId: true, employeeId: true, appointmentDate: true, startTime: true },
    });

    if (!existing) {
      throw new BadRequestException('Appointment not found');
    }

    if (existing.customerId !== profile.id) {
      throw new ForbiddenException('You can only update your own appointment');
    }

    const spaId = dto.spaId ?? existing.spaId;
    const serviceId = dto.serviceId ?? existing.serviceId;
    const employeeId = dto.employeeId ?? existing.employeeId;

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      select: { id: true, spaId: true, durationMinutes: true, price: true },
    });
    if (!service) throw new BadRequestException('Service not found');
    if (service.spaId !== spaId) {
      throw new BadRequestException('Service does not belong to the spa');
    }
    if (employeeId) {
      const employee = await this.employeesRepository.findOne({
        where: { id: employeeId },
        select: { id: true, spaId: true },
      });
      if (!employee) throw new BadRequestException('Employee not found');
      if (employee.spaId !== spaId) {
        throw new BadRequestException('Employee does not belong to the spa');
      }
    }

    const appointmentDate = dto.appointmentDate ?? existing.appointmentDate;
    const startTime = dto.startTime ?? existing.startTime;
    const startMinutes = this.timeToMinutes(startTime);
    const endTime = this.minutesToTime(startMinutes + service.durationMinutes);

    await this.ensureNoOverlap({
      appointmentDate,
      startTime,
      endTime,
      employeeId: employeeId ?? null,
      spaId,
      excludeAppointmentId: id,
    });

    return super.update(id, {
      appointmentDate,
      startTime,
      endTime,
      spaId,
      serviceId,
      employeeId: employeeId ?? null,
      notes: dto.notes,
      finalPrice: service.price,
    } as any);
  }

  private timeToMinutes(value: string): number {
    const [hh, mm] = value.split(':').map((x) => Number(x));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
      throw new BadRequestException('Invalid time format');
    }
    return hh * 60 + mm;
  }

  private minutesToTime(totalMinutes: number): string {
    const minutesInDay = 24 * 60;
    const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
    const hh = Math.floor(normalized / 60);
    const mm = normalized % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
  }

  private async ensureNoOverlap(input: {
    appointmentDate: string;
    startTime: string;
    endTime: string;
    employeeId: string | null;
    spaId: string;
    excludeAppointmentId?: string;
  }): Promise<void> {
    // Minimal safe rule: prevent overlaps for a given employee on the same date.
    if (!input.employeeId) return;

    const qb = this.appointmentsRepository
      .createQueryBuilder('a')
      .select('a.id', 'id')
      .where('a.employeeId = :employeeId', { employeeId: input.employeeId })
      .andWhere('a.appointmentDate = :appointmentDate', {
        appointmentDate: input.appointmentDate,
      })
      .andWhere('a.status NOT IN (:...blockedStatuses)', {
        blockedStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .andWhere('a.startTime < :endTime', { endTime: input.endTime })
      .andWhere('a.endTime > :startTime', { startTime: input.startTime });

    if (input.excludeAppointmentId) {
      qb.andWhere('a.id <> :excludeId', { excludeId: input.excludeAppointmentId });
    }

    const conflict = await qb.getRawOne<{ id: string }>();
    if (conflict?.id) {
      throw new BadRequestException('Appointment overlaps with an existing one');
    }
  }
}
