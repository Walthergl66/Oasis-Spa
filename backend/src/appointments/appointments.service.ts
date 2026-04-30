import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { Employee } from '../employees/entities/employee.entity';
import { Service } from '../services/entities/service.entity';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
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

  async create(createAppointmentDto: CreateAppointmentDto) {
    await Promise.all([
      this.ensureExists(this.usersRepository, createAppointmentDto.customerId, 'User'),
      this.ensureExists(this.spasRepository, createAppointmentDto.spaId, 'Spa'),
      this.ensureExists(
        this.servicesRepository,
        createAppointmentDto.serviceId,
        'Service',
      ),
    ]);

    if (createAppointmentDto.employeeId) {
      await this.ensureExists(
        this.employeesRepository,
        createAppointmentDto.employeeId,
        'Employee',
      );
    }

    return super.create(createAppointmentDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['customer', 'spa', 'service', 'employee', 'payments', 'review'],
      order: { createdAt: 'DESC' },
    });
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
    if (updateAppointmentDto.customerId) {
      await this.ensureExists(this.usersRepository, updateAppointmentDto.customerId, 'User');
    }

    if (updateAppointmentDto.spaId) {
      await this.ensureExists(this.spasRepository, updateAppointmentDto.spaId, 'Spa');
    }

    if (updateAppointmentDto.serviceId) {
      await this.ensureExists(
        this.servicesRepository,
        updateAppointmentDto.serviceId,
        'Service',
      );
    }

    if (updateAppointmentDto.employeeId) {
      await this.ensureExists(
        this.employeesRepository,
        updateAppointmentDto.employeeId,
        'Employee',
      );
    }

    return super.update(id, updateAppointmentDto);
  }
}
