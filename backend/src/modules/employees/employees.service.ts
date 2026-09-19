import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmployeeProfile } from './entities/employee.entity.js';
import { EmployeeSchedule } from './entities/employee-schedule.entity.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { SetScheduleDto } from './dto/set-schedule.dto.js';
import { ServiceEntity } from '../services/entities/service.entity.js';
import { UsersService } from '../users/users.service.js';
import { Role } from '../../common/enums/role.enum.js';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeProfile)
    private readonly employeeRepository: Repository<EmployeeProfile>,
    @InjectRepository(EmployeeSchedule)
    private readonly scheduleRepository: Repository<EmployeeSchedule>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    private readonly usersService: UsersService,
  ) {}

  async create(createDto: CreateEmployeeDto): Promise<EmployeeProfile> {
    const user = await this.usersService.findById(createDto.userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${createDto.userId} no encontrado`);
    }

    const existing = await this.employeeRepository.findOne({
      where: { userId: createDto.userId },
    });
    if (existing) {
      throw new ConflictException('Este usuario ya tiene un perfil de empleado asignado');
    }

    // Asegurar rol EMPLOYEE
    if (user.role !== Role.EMPLOYEE && user.role !== Role.ADMIN) {
      await this.usersService.updateRole(user.id, Role.EMPLOYEE);
    }

    let services: ServiceEntity[] = [];
    if (createDto.serviceIds && createDto.serviceIds.length > 0) {
      services = await this.serviceRepository.findBy({
        id: In(createDto.serviceIds),
      });
    }

    const employee = this.employeeRepository.create({
      userId: createDto.userId,
      specialty: createDto.specialty,
      bio: createDto.bio,
      isActive: createDto.isActive ?? true,
      services,
    });

    const saved = await this.employeeRepository.save(employee);
    // Crear horarios estándar de Lunes a Sábado por defecto
    await this.initDefaultSchedule(saved.id);
    return this.findById(saved.id);
  }

  async findAll(isActive?: boolean): Promise<EmployeeProfile[]> {
    const query = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.services', 'services')
      .leftJoinAndSelect('employee.schedules', 'schedules');

    if (isActive !== undefined) {
      query.where('employee.isActive = :isActive', { isActive });
    }

    query.orderBy('user.lastName', 'ASC');
    return query.getMany();
  }

  async findById(id: string): Promise<EmployeeProfile> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: { user: true, services: true, schedules: true },
    });
    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }
    return employee;
  }

  async findByUserId(userId: string): Promise<EmployeeProfile> {
    const employee = await this.employeeRepository.findOne({
      where: { userId },
      relations: { user: true, services: true, schedules: true },
    });
    if (!employee) {
      throw new NotFoundException(`Perfil de empleado para el usuario ${userId} no encontrado`);
    }
    return employee;
  }

  async findEmployeesByService(serviceId: string): Promise<EmployeeProfile[]> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoinAndSelect('employee.services', 'service', 'service.id = :serviceId', {
        serviceId,
      })
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.schedules', 'schedules')
      .where('employee.isActive = true')
      .andWhere('service.isActive = true')
      .getMany();
  }

  async update(id: string, updateDto: UpdateEmployeeDto): Promise<EmployeeProfile> {
    const employee = await this.findById(id);

    if (updateDto.specialty !== undefined) employee.specialty = updateDto.specialty;
    if (updateDto.bio !== undefined) employee.bio = updateDto.bio;
    if (updateDto.isActive !== undefined) employee.isActive = updateDto.isActive;

    if (updateDto.serviceIds !== undefined) {
      employee.services = await this.serviceRepository.findBy({
        id: In(updateDto.serviceIds),
      });
    }

    await this.employeeRepository.save(employee);
    return this.findById(id);
  }

  async setSchedule(
    employeeId: string,
    setScheduleDto: SetScheduleDto,
  ): Promise<EmployeeSchedule[]> {
    await this.findById(employeeId);

    // Eliminar horarios anteriores para reemplazarlos limpiamente
    await this.scheduleRepository.delete({ employeeId });

    const newSchedules = setScheduleDto.schedules.map((item) =>
      this.scheduleRepository.create({
        employeeId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        breakStart: item.breakStart || null,
        breakEnd: item.breakEnd || null,
        isWorkingDay: item.isWorkingDay ?? true,
      }),
    );

    return this.scheduleRepository.save(newSchedules);
  }

  async getSchedule(employeeId: string): Promise<EmployeeSchedule[]> {
    await this.findById(employeeId);
    return this.scheduleRepository.find({
      where: { employeeId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async toggleStatus(id: string, isActive: boolean): Promise<EmployeeProfile> {
    const employee = await this.findById(id);
    employee.isActive = isActive;
    return this.employeeRepository.save(employee);
  }

  private async initDefaultSchedule(employeeId: string): Promise<void> {
    const defaultDays = [1, 2, 3, 4, 5, 6]; // Lunes a Sábado
    const schedules = defaultDays.map((day) =>
      this.scheduleRepository.create({
        employeeId,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        isWorkingDay: true,
      }),
    );
    // Domingo no laborable
    schedules.push(
      this.scheduleRepository.create({
        employeeId,
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '18:00',
        isWorkingDay: false,
      }),
    );
    await this.scheduleRepository.save(schedules);
  }
}
