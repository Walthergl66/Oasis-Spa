import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum.js';
import { ServicesService } from '../services/services.service.js';
import { EmployeesService } from '../employees/employees.service.js';
import { EmployeeProfile } from '../employees/entities/employee.entity.js';
import { GetAvailabilityDto } from './dto/get-availability.dto.js';
import {
  AvailabilityResponseDto,
  AvailableSlotDto,
} from './dto/availability-response.dto.js';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly servicesService: ServicesService,
    private readonly employeesService: EmployeesService,
    private readonly configService: ConfigService,
  ) {}

  async getAvailableSlots(
    query: GetAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const service = await this.servicesService.findById(query.serviceId);
    if (!service.isActive) {
      throw new BadRequestException('El servicio seleccionado no está activo');
    }

    const [year, month, day] = query.date.split('-').map(Number);
    if (!year || !month || !day) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // Fecha en hora local (interpretada según día de calendario)
    const targetDateLocal = new Date(year, month - 1, day);
    const dayOfWeek = targetDateLocal.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    // Identificar empleados asignables
    let employees: EmployeeProfile[] = [];
    if (query.employeeId) {
      const emp = await this.employeesService.findById(query.employeeId);
      const canDoService = emp.services?.some((s) => s.id === service.id);
      if (!canDoService) {
        throw new BadRequestException(
          'El terapeuta seleccionado no realiza el servicio solicitado',
        );
      }
      employees = [emp];
    } else {
      employees = await this.employeesService.findEmployeesByService(service.id);
    }

    const availableSlots: AvailableSlotDto[] = [];
    const now = new Date();

    for (const employee of employees) {
      if (!employee.isActive) continue;

      const schedule = employee.schedules?.find(
        (s) => s.dayOfWeek === dayOfWeek && s.isWorkingDay,
      );
      if (!schedule) continue;

      // Horas del turno del empleado (HH:mm)
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);

      // Límites de la jornada en UTC
      const workStartUtc = this.createUtcDate(query.date, startHour, startMin);
      const workEndUtc = this.createUtcDate(query.date, endHour, endMin);

      // Franja de descanso
      let breakStartUtc: Date | null = null;
      let breakEndUtc: Date | null = null;
      if (schedule.breakStart && schedule.breakEnd) {
        const [bStartH, bStartM] = schedule.breakStart.split(':').map(Number);
        const [bEndH, bEndM] = schedule.breakEnd.split(':').map(Number);
        breakStartUtc = this.createUtcDate(query.date, bStartH, bStartM);
        breakEndUtc = this.createUtcDate(query.date, bEndH, bEndM);
      }

      // Citas existentes del empleado para ese día (no canceladas)
      const existingAppointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.employeeId = :employeeId', { employeeId: employee.id })
        .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [AppointmentStatus.CANCELLED],
        })
        .andWhere('appointment.startTime < :workEndUtc', { workEndUtc })
        .andWhere('appointment.endTime > :workStartUtc', { workStartUtc })
        .getMany();

      // Generación de slots candidatos cada 30 minutos
      const stepMinutes = 30;
      let currentSlotStart = new Date(workStartUtc);

      while (true) {
        const currentSlotEnd = new Date(
          currentSlotStart.getTime() + service.durationMinutes * 60 * 1000,
        );

        if (currentSlotEnd.getTime() > workEndUtc.getTime()) {
          break;
        }

        // Validar que no choque con almuerzo/descanso
        const overlapsBreak =
          breakStartUtc &&
          breakEndUtc &&
          currentSlotStart < breakEndUtc &&
          currentSlotEnd > breakStartUtc;

        // Validar que no choque con citas existentes
        const overlapsAppointment = existingAppointments.some(
          (appt) =>
            currentSlotStart < new Date(appt.endTime) &&
            currentSlotEnd > new Date(appt.startTime),
        );

        // Validar que no sea en el pasado si es hoy (margen de 15 min)
        const isPast = currentSlotStart.getTime() <= now.getTime() + 15 * 60 * 1000;

        if (!overlapsBreak && !overlapsAppointment && !isPast) {
          const employeeName = employee.user
            ? `${employee.user.firstName} ${employee.user.lastName}`.trim()
            : 'Especialista Spa';

          availableSlots.push({
            employeeId: employee.id,
            employeeName,
            startTime: currentSlotStart.toISOString(),
            endTime: currentSlotEnd.toISOString(),
            startTimeFormatted: this.formatTime(currentSlotStart),
            endTimeFormatted: this.formatTime(currentSlotEnd),
          });
        }

        currentSlotStart = new Date(
          currentSlotStart.getTime() + stepMinutes * 60 * 1000,
        );
      }
    }

    // Ordenar slots por hora de inicio cronológica
    availableSlots.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    return {
      date: query.date,
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      availableSlots,
    };
  }

  async isSlotAvailable(
    employeeId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.employeeId = :employeeId', { employeeId })
      .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [AppointmentStatus.CANCELLED],
      })
      .andWhere('appointment.startTime < :endTime', { endTime })
      .andWhere('appointment.endTime > :startTime', { startTime });

    if (excludeAppointmentId) {
      query.andWhere('appointment.id != :excludeId', {
        excludeId: excludeAppointmentId,
      });
    }

    const collision = await query.getOne();
    return !collision;
  }

  private createUtcDate(dateStr: string, hour: number, minute: number): Date {
    // Zona horaria estándar Ecuador / Spa (UTC-5)
    // Para convertir hora local HH:mm en UTC: horaUTC = horaLocal + 5
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, hour + 5, minute, 0));
  }

  private formatTime(date: Date): string {
    // Formatear en hora local del Spa (UTC-5)
    const local = new Date(date.getTime() - 5 * 60 * 60 * 1000);
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const mm = String(local.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
