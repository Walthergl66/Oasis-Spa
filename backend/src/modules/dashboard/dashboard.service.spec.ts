import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from './dashboard.service.js';

function makeQb(terminal: Record<string, unknown>) {
  const qb: any = {};
  const chain = [
    'select', 'addSelect', 'where', 'andWhere', 'groupBy', 'addGroupBy',
    'orderBy', 'limit', 'take', 'leftJoinAndSelect', 'innerJoin',
  ];
  for (const m of chain) qb[m] = vi.fn().mockReturnValue(qb);
  Object.assign(qb, terminal);
  return qb;
}

describe('DashboardService (Sprint 7: KPIs y ocupación)', () => {
  let service: DashboardService;
  let mockRepo: any;
  let mockEmployees: any;

  beforeEach(() => {
    mockRepo = { createQueryBuilder: vi.fn() };
    mockEmployees = { findAll: vi.fn(), findById: vi.fn() };
    service = new DashboardService(mockRepo, mockEmployees);
  });

  it('summary calcula total, cancelRate e ingresos por estado', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(
      makeQb({
        getRawMany: vi.fn().mockResolvedValue([
          { status: 'CONFIRMED', count: '2', revenue: '100' },
          { status: 'COMPLETED', count: '1', revenue: '50' },
          { status: 'CANCELLED', count: '1', revenue: '0' },
        ]),
      }),
    );
    const summary = await service.getSummary();
    expect(summary.total).toBe(4);
    expect(summary.cancelRate).toBe(0.25);
    expect(summary.revenueCompleted).toBe(50);
    expect(summary.revenueProjected).toBe(100);
  });

  it('summary con cero citas evita división por cero', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb({ getRawMany: vi.fn().mockResolvedValue([]) }));
    const summary = await service.getSummary();
    expect(summary.total).toBe(0);
    expect(summary.cancelRate).toBe(0);
  });

  it('top services mapea reservas e ingresos numéricos', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(
      makeQb({
        getRawMany: vi.fn().mockResolvedValue([
          { serviceId: 's1', serviceName: 'Masaje', bookings: '10', revenue: '500' },
        ]),
      }),
    );
    const top = await service.getTopServices({ limit: 5 });
    expect(top).toEqual([{ serviceId: 's1', serviceName: 'Masaje', bookings: 10, revenue: 500 }]);
  });

  it('occupancy compara jornada vs minutos reservados (2026-09-25 viernes)', async () => {
    mockEmployees.findAll.mockResolvedValue([
      {
        id: 'emp-1',
        isActive: true,
        user: { firstName: 'Ana', lastName: 'Paz' },
        schedules: [
          { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', isWorkingDay: true },
        ],
      },
    ]);
    mockRepo.createQueryBuilder.mockReturnValue(
      makeQb({
        getMany: vi.fn().mockResolvedValue([
          { employeeId: 'emp-1', startTime: new Date('2026-09-25T15:00:00Z'), endTime: new Date('2026-09-25T16:00:00Z') },
        ]),
      }),
    );
    const occupancy = await service.getOccupancy('2026-09-25');
    expect(occupancy.employees).toHaveLength(1);
    expect(occupancy.employees[0].workMinutes).toBe(480);
    expect(occupancy.employees[0].bookedMinutes).toBe(60);
    expect(occupancy.employees[0].occupancyRate).toBe(0.125);
    expect(occupancy.averageRate).toBe(0.125);
  });
});
