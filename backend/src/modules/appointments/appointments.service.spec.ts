import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppointmentsService } from './appointments.service.js';
import { AppointmentStatus } from './enums/appointment-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';

describe('AppointmentsService (Sprint 3: solapamiento y márgenes)', () => {
  let service: AppointmentsService;
  let mockRepository: any;
  let mockDataSource: any;
  let mockServicesService: any;
  let mockEmployeesService: any;
  let mockAvailabilityService: any;
  let mockEventEmitter: any;

  const serviceEntity = {
    id: 'service-1',
    name: 'Masaje Relajante',
    durationMinutes: 60,
    price: 50,
    isActive: true,
  };

  const employeeEntity = {
    id: 'employee-1',
    isActive: true,
    services: [{ id: 'service-1' }],
  };

  beforeEach(() => {
    mockRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    mockDataSource = {
      transaction: vi.fn(async (cb: any) => {
        const manager = {
          create: vi.fn((_: any, dto: any) => ({ id: 'appt-1', ...dto })),
          save: vi.fn(async (_: any, dto: any) => ({ id: 'appt-1', ...dto })),
        };
        return cb(manager);
      }),
    };
    mockServicesService = { findById: vi.fn() };
    mockEmployeesService = { findById: vi.fn() };
    mockAvailabilityService = { isSlotAvailable: vi.fn() };
    mockEventEmitter = { emit: vi.fn() };

    service = new AppointmentsService(
      mockRepository,
      mockDataSource,
      mockServicesService,
      mockEmployeesService,
      mockAvailabilityService,
      mockEventEmitter,
    );
  });

  it('rechaza crear cita si el servicio está inactivo', async () => {
    mockServicesService.findById.mockResolvedValue({ ...serviceEntity, isActive: false });
    await expect(
      service.createAppointment('client-1', {
        serviceId: 'service-1',
        employeeId: 'employee-1',
        startTime: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).rejects.toThrow('no está activo');
  });

  it('rechaza crear cita en el pasado', async () => {
    mockServicesService.findById.mockResolvedValue(serviceEntity);
    mockEmployeesService.findById.mockResolvedValue(employeeEntity);
    await expect(
      service.createAppointment('client-1', {
        serviceId: 'service-1',
        employeeId: 'employee-1',
        startTime: new Date(Date.now() - 3600000).toISOString(),
      }),
    ).rejects.toThrow('pasado');
  });

  it('rechaza crear cita cuando el slot está solapado (doble reserva en código)', async () => {
    mockServicesService.findById.mockResolvedValue(serviceEntity);
    mockEmployeesService.findById.mockResolvedValue(employeeEntity);
    mockAvailabilityService.isSlotAvailable.mockResolvedValue(false);
    await expect(
      service.createAppointment('client-1', {
        serviceId: 'service-1',
        employeeId: 'employee-1',
        startTime: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).rejects.toThrow('ya no está disponible');
  });

  it('crea cita y emite appointment.created cuando el slot está libre', async () => {
    mockServicesService.findById.mockResolvedValue(serviceEntity);
    mockEmployeesService.findById.mockResolvedValue(employeeEntity);
    mockAvailabilityService.isSlotAvailable.mockResolvedValue(true);
    mockRepository.findOne.mockResolvedValue({
      id: 'appt-1',
      clientId: 'client-1',
      status: AppointmentStatus.PENDING,
    });
    const result = await service.createAppointment('client-1', {
      serviceId: 'service-1',
      employeeId: 'employee-1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result.id).toBe('appt-1');
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'appointment.created',
      expect.anything(),
    );
  });

  it('impide cancelar con menos de 2h para CLIENT pero lo permite a ADMIN', async () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000);
    mockRepository.findOne.mockResolvedValue({
      id: 'appt-1',
      clientId: 'client-1',
      status: AppointmentStatus.PENDING,
      startTime: soon,
    });
    mockRepository.save.mockImplementation(async (a: any) => a);

    await expect(
      service.cancelAppointment('appt-1', 'client-1', Role.CLIENT, {}),
    ).rejects.toThrow('2 horas');

    const ok = await service.cancelAppointment('appt-1', 'admin-1', Role.ADMIN, {
      reason: 'Sobrecupo operativo',
    });
    expect(ok.status).toBe(AppointmentStatus.CANCELLED);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'appointment.cancelled',
      expect.anything(),
    );
  });

  it('rechaza reprogramar a un horario ocupado', async () => {
    const future = new Date(Date.now() + 86400000);
    mockRepository.findOne.mockResolvedValue({
      id: 'appt-1',
      clientId: 'client-1',
      serviceId: 'service-1',
      employeeId: 'employee-1',
      status: AppointmentStatus.CONFIRMED,
      startTime: future,
    });
    mockServicesService.findById.mockResolvedValue(serviceEntity);
    mockAvailabilityService.isSlotAvailable.mockResolvedValue(false);
    await expect(
      service.rescheduleAppointment('appt-1', 'client-1', Role.CLIENT, {
        startTime: new Date(Date.now() + 2 * 86400000).toISOString(),
      }),
    ).rejects.toThrow('no está disponible');
  });

  it('solo confirma citas PENDING', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: 'appt-1',
      status: AppointmentStatus.CONFIRMED,
    });
    await expect(service.confirmAppointment('appt-1')).rejects.toThrow(
      'pendientes',
    );
  });
});
