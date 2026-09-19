import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum.js';
import { EmployeesService } from '../employees/employees.service.js';
import type {
  DashboardRangeDto,
  HistoryQueryDto,
} from './dto/dashboard-filter.dto.js';

export interface StatusKpi {
  status: AppointmentStatus;
  count: number;
  revenue: number;
}

export interface SummaryKpi {
  range: { startDate: string; endDate: string };
  total: number;
  byStatus: StatusKpi[];
  cancelRate: number;
  revenueCompleted: number;
  revenueProjected: number;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

export interface EmployeeOccupancy {
  employeeId: string;
  employeeName: string;
  workMinutes: number;
  bookedMinutes: number;
  occupancyRate: number | null;
}

function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Rango por defecto: últimos 30 días hasta ahora. */
function resolveRange(dto?: DashboardRangeDto): { start: Date; end: Date } {
  const end = dto?.endDate ? new Date(dto.endDate) : new Date();
  const start = dto?.startDate
    ? new Date(dto.startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/** YMD del spa (UTC-5) para un instante dado. */
function spaYmd(now: Date): string {
  const local = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

/**
 * Indicadores y reportes administrativos (RF-26 a RF-28).
 * Solo lectura agregada sobre citas; nunca muta reservas.
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly employeesService: EmployeesService,
  ) {}

  async getSummary(dto?: DashboardRangeDto): Promise<SummaryKpi> {
    const { start, end } = resolveRange(dto);
    const rows = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(appointment.totalPrice), 0)', 'revenue')
      .where('appointment.startTime >= :start', { start })
      .andWhere('appointment.startTime <= :end', { end })
      .groupBy('appointment.status')
      .getRawMany<{ status: AppointmentStatus; count: string; revenue: string }>();

    const byStatus: StatusKpi[] = rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      revenue: Number(r.revenue),
    }));
    const total = byStatus.reduce((acc, r) => acc + r.count, 0);
    const cancelled = byStatus.find((r) => r.status === AppointmentStatus.CANCELLED)?.count ?? 0;
    const revenueCompleted =
      byStatus.find((r) => r.status === AppointmentStatus.COMPLETED)?.revenue ?? 0;
    const revenueProjected = byStatus
      .filter((r) => r.status === AppointmentStatus.PENDING || r.status === AppointmentStatus.CONFIRMED)
      .reduce((acc, r) => acc + r.revenue, 0);

    return {
      range: { startDate: start.toISOString(), endDate: end.toISOString() },
      total,
      byStatus,
      cancelRate: total === 0 ? 0 : Number((cancelled / total).toFixed(4)),
      revenueCompleted,
      revenueProjected,
    };
  }

  async getTopServices(dto?: DashboardRangeDto & { limit?: number }): Promise<TopService[]> {
    const { start, end } = resolveRange(dto);
    const limit = dto?.limit ?? 5;
    const rows = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.service', 'service')
      .select('service.id', 'serviceId')
      .addSelect('service.name', 'serviceName')
      .addSelect('COUNT(*)', 'bookings')
      .addSelect('COALESCE(SUM(appointment.totalPrice), 0)', 'revenue')
      .where('appointment.startTime >= :start', { start })
      .andWhere('appointment.startTime <= :end', { end })
      .andWhere('appointment.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .groupBy('service.id')
      .addGroupBy('service.name')
      .orderBy('bookings', 'DESC')
      .limit(limit)
      .getRawMany<{ serviceId: string; serviceName: string; bookings: string; revenue: string }>();

    return rows.map((r) => ({
      serviceId: r.serviceId,
      serviceName: r.serviceName,
      bookings: Number(r.bookings),
      revenue: Number(r.revenue),
    }));
  }

  async getOccupancy(
    dateYmd?: string,
    employeeId?: string,
  ): Promise<{ date: string; employees: EmployeeOccupancy[]; averageRate: number | null }> {
    const ymd = dateYmd ?? spaYmd(new Date());
    const [y, m, d] = ymd.split('-').map(Number);
    const dayStart = new Date(Date.UTC(y, m - 1, d, 5, 0, 0));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();

    const employees = employeeId
      ? [await this.employeesService.findById(employeeId)]
      : await this.employeesService.findAll(true);

    const dayAppointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.startTime >= :dayStart', { dayStart })
      .andWhere('appointment.startTime < :dayEnd', { dayEnd })
      .andWhere('appointment.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .getMany();

    const result: EmployeeOccupancy[] = employees
      .filter((e) => e.isActive)
      .map((employee) => {
        const schedule = employee.schedules?.find(
          (s) => s.dayOfWeek === dayOfWeek && s.isWorkingDay,
        );
        let workMinutes = 0;
        if (schedule) {
          workMinutes = hhmmToMinutes(schedule.endTime) - hhmmToMinutes(schedule.startTime);
          if (schedule.breakStart && schedule.breakEnd) {
            workMinutes -= hhmmToMinutes(schedule.breakEnd) - hhmmToMinutes(schedule.breakStart);
          }
        }
        const bookedMinutes = dayAppointments
          .filter((a) => a.employeeId === employee.id)
          .reduce(
            (acc, a) =>
              acc + (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000,
            0,
          );
        const employeeName = employee.user
          ? `${employee.user.firstName} ${employee.user.lastName}`.trim()
          : 'Especialista';
        return {
          employeeId: employee.id,
          employeeName,
          workMinutes,
          bookedMinutes: Math.round(bookedMinutes),
          occupancyRate:
            workMinutes > 0 ? Number((bookedMinutes / workMinutes).toFixed(4)) : null,
        };
      });

    const withRate = result.filter((r) => r.occupancyRate !== null);
    const averageRate =
      withRate.length === 0
        ? null
        : Number(
            (withRate.reduce((acc, r) => acc + (r.occupancyRate ?? 0), 0) / withRate.length).toFixed(4),
          );

    return { date: ymd, employees: result, averageRate };
  }

  async getHistory(filter: HistoryQueryDto): Promise<Appointment[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.employee', 'employee')
      .leftJoinAndSelect('employee.user', 'empUser')
      .leftJoinAndSelect('appointment.service', 'service');

    if (filter.status) {
      query.andWhere('appointment.status = :status', { status: filter.status });
    }
    if (filter.employeeId) {
      query.andWhere('appointment.employeeId = :employeeId', { employeeId: filter.employeeId });
    }
    if (filter.serviceId) {
      query.andWhere('appointment.serviceId = :serviceId', { serviceId: filter.serviceId });
    }
    if (filter.startDate) {
      query.andWhere('appointment.startTime >= :startDate', { startDate: filter.startDate });
    }
    if (filter.endDate) {
      query.andWhere('appointment.startTime <= :endDate', { endDate: filter.endDate });
    }

    return query.orderBy('appointment.startTime', 'DESC').take(100).getMany();
  }
}
