import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Appointment } from './entities/appointment.entity.js';
import { AppointmentStatus } from './enums/appointment-status.enum.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto.js';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto.js';
import { AppointmentFilterDto } from './dto/appointment-filter.dto.js';
import { ServicesService } from '../services/services.service.js';
import { EmployeesService } from '../employees/employees.service.js';
import { AvailabilityService } from '../availability/availability.service.js';
import { Role } from '../../common/enums/role.enum.js';

/** Margen mínimo de antelación para cancelar o reprogramar (en ms): 2 horas */
const CANCEL_MARGIN_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly dataSource: DataSource,
    private readonly servicesService: ServicesService,
    private readonly employeesService: EmployeesService,
    private readonly availabilityService: AvailabilityService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Crear cita dentro de una transacción.
   * Validación algorítmica + la restricción GiST de PostgreSQL como red de seguridad.
   */
  async createAppointment(
    clientId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const service = await this.servicesService.findById(dto.serviceId);
    if (!service.isActive) {
      throw new BadRequestException('El servicio seleccionado no está activo');
    }

    const employee = await this.employeesService.findById(dto.employeeId);
    if (!employee.isActive) {
      throw new BadRequestException('El especialista seleccionado no está disponible');
    }

    const canDoService = employee.services?.some((s) => s.id === service.id);
    if (!canDoService) {
      throw new BadRequestException(
        'El especialista seleccionado no realiza el servicio solicitado',
      );
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(
      startTime.getTime() + service.durationMinutes * 60 * 1000,
    );

    if (startTime <= new Date()) {
      throw new BadRequestException('No se puede agendar una cita en el pasado');
    }

    // Validación algorítmica de disponibilidad
    const slotAvailable = await this.availabilityService.isSlotAvailable(
      employee.id,
      startTime,
      endTime,
    );
    if (!slotAvailable) {
      throw new ConflictException(
        'El horario seleccionado ya no está disponible. Por favor elija otro.',
      );
    }

    // Transacción para creación atómica
    const appointment = await this.dataSource.transaction(async (manager) => {
      const newAppointment = manager.create(Appointment, {
        clientId,
        employeeId: employee.id,
        serviceId: service.id,
        startTime,
        endTime,
        totalPrice: service.price,
        status: AppointmentStatus.PENDING,
        notes: dto.notes || null,
      });

      return manager.save(Appointment, newAppointment);
    });

    // Recargar con relaciones
    const saved = await this.findById(appointment.id);

    this.eventEmitter.emit('appointment.created', saved);
    return saved;
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: { client: true, employee: { user: true }, service: true },
    });
    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }
    return appointment;
  }

  async findByClient(clientId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { clientId },
      relations: { employee: { user: true }, service: true },
      order: { startTime: 'DESC' },
    });
  }

  async findByEmployee(employeeId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { employeeId },
      relations: { client: true, service: true },
      order: { startTime: 'ASC' },
    });
  }

  async findAll(filter?: AppointmentFilterDto): Promise<Appointment[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.employee', 'employee')
      .leftJoinAndSelect('employee.user', 'empUser')
      .leftJoinAndSelect('appointment.service', 'service');

    if (filter?.status) {
      query.andWhere('appointment.status = :status', { status: filter.status });
    }
    if (filter?.employeeId) {
      query.andWhere('appointment.employeeId = :employeeId', {
        employeeId: filter.employeeId,
      });
    }
    if (filter?.clientId) {
      query.andWhere('appointment.clientId = :clientId', {
        clientId: filter.clientId,
      });
    }
    if (filter?.startDate) {
      query.andWhere('appointment.startTime >= :startDate', {
        startDate: filter.startDate,
      });
    }
    if (filter?.endDate) {
      query.andWhere('appointment.startTime <= :endDate', {
        endDate: filter.endDate,
      });
    }

    query.orderBy('appointment.startTime', 'DESC');
    return query.getMany();
  }

  async confirmAppointment(id: string): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        `Solo se pueden confirmar citas pendientes. Estado actual: ${appointment.status}`,
      );
    }
    appointment.status = AppointmentStatus.CONFIRMED;
    const saved = await this.appointmentRepository.save(appointment);
    this.eventEmitter.emit('appointment.confirmed', saved);
    return saved;
  }

  async completeAppointment(id: string): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.PENDING
    ) {
      throw new BadRequestException(
        `Solo se pueden completar citas confirmadas o pendientes. Estado actual: ${appointment.status}`,
      );
    }
    appointment.status = AppointmentStatus.COMPLETED;
    return this.appointmentRepository.save(appointment);
  }

  async markNoShow(id: string): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.PENDING
    ) {
      throw new BadRequestException(
        `Solo se puede marcar como no-show a citas confirmadas o pendientes.`,
      );
    }
    appointment.status = AppointmentStatus.NO_SHOW;
    return this.appointmentRepository.save(appointment);
  }

  async cancelAppointment(
    id: string,
    cancelledById: string,
    userRole: Role,
    dto?: CancelAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Esta cita ya fue cancelada');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una cita ya completada');
    }

    // El admin puede cancelar sin restricción de tiempo
    if (userRole !== Role.ADMIN) {
      // Clientes y empleados requieren margen mínimo de 2 horas
      const timeUntilAppt =
        new Date(appointment.startTime).getTime() - Date.now();
      if (timeUntilAppt < CANCEL_MARGIN_MS) {
        throw new BadRequestException(
          'No es posible cancelar con menos de 2 horas de antelación. Contacte con el spa directamente.',
        );
      }
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = dto?.reason || null;
    appointment.cancelledAt = new Date();
    appointment.cancelledById = cancelledById;

    const saved = await this.appointmentRepository.save(appointment);
    this.eventEmitter.emit('appointment.cancelled', saved);
    return saved;
  }

  async rescheduleAppointment(
    id: string,
    userId: string,
    userRole: Role,
    dto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `No se puede reprogramar una cita con estado ${appointment.status}`,
      );
    }

    // Margen de antelación para clientes y empleados
    if (userRole !== Role.ADMIN) {
      const timeUntilAppt =
        new Date(appointment.startTime).getTime() - Date.now();
      if (timeUntilAppt < CANCEL_MARGIN_MS) {
        throw new BadRequestException(
          'No es posible reprogramar con menos de 2 horas de antelación.',
        );
      }
    }

    const newStartTime = new Date(dto.startTime);
    if (newStartTime <= new Date()) {
      throw new BadRequestException(
        'La nueva fecha y hora debe ser en el futuro',
      );
    }

    const service = await this.servicesService.findById(appointment.serviceId);
    const newEndTime = new Date(
      newStartTime.getTime() + service.durationMinutes * 60 * 1000,
    );

    const slotAvailable = await this.availabilityService.isSlotAvailable(
      appointment.employeeId,
      newStartTime,
      newEndTime,
      appointment.id,
    );
    if (!slotAvailable) {
      throw new ConflictException(
        'El nuevo horario seleccionado no está disponible.',
      );
    }

    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    appointment.status = AppointmentStatus.PENDING;

    const saved = await this.appointmentRepository.save(appointment);
    this.eventEmitter.emit('appointment.rescheduled', saved);
    return saved;
  }
}
