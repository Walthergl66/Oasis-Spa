import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssistantToolsService, spaToUtcIso } from './assistant-tools.service.js';
import { AppointmentStatus } from '../../appointments/enums/appointment-status.enum.js';
import { Role } from '../../../common/enums/role.enum.js';

const CTX = { userId: 'client-1', role: Role.CLIENT };
const SERVICE = { id: '11111111-1111-4111-8111-111111111111', name: 'Masaje Relajante', price: 50, durationMinutes: 60 };
const SLOT_ISO = '2026-09-25T15:00:00.000Z'; // 10:00 hora del spa

describe('spaToUtcIso', () => {
  it('suma 5h (UTC-5) a la hora local del spa', () => {
    expect(spaToUtcIso('2026-09-25', '10:00')).toBe(SLOT_ISO);
  });
});

describe('AssistantToolsService (Sprint 6: tools + dos pasos)', () => {
  let service: AssistantToolsService;
  let mockServices: any;
  let mockAvailability: any;
  let mockAppointments: any;

  beforeEach(() => {
    mockServices = { findAllActive: vi.fn(), findById: vi.fn() };
    mockAvailability = { getAvailableSlots: vi.fn() };
    mockAppointments = {
      createAppointment: vi.fn(),
      findById: vi.fn(),
      findByClient: vi.fn(),
      rescheduleAppointment: vi.fn(),
      cancelAppointment: vi.fn(),
    };
    service = new AssistantToolsService(mockServices, mockAvailability, mockAppointments);
  });

  it('expone 6 esquemas fuera del modelo', () => {
    const names = service.listSchemas().map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'listarServicios',
        'misCitas',
        'consultarDisponibilidad',
        'registrarCita',
        'modificarCita',
        'cancelarCita',
      ]),
    );
  });

  it('rechaza herramienta desconocida y sin identidad', async () => {
    await expect(service.execute('noExiste', {}, CTX)).resolves.toMatchObject({ ok: false });
    await expect(
      service.execute('listarServicios', {}, { userId: '', role: Role.CLIENT }),
    ).resolves.toMatchObject({ ok: false });
  });

  it('listarServicios resume el catálogo real', async () => {
    mockServices.findAllActive.mockResolvedValue([SERVICE]);
    const result = await service.execute('listarServicios', {}, CTX);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary).toContain('Masaje Relajante');
  });

  it('registrarCita propone primero y crea solo tras confirmar', async () => {
    mockServices.findById.mockResolvedValue(SERVICE);
    mockAvailability.getAvailableSlots.mockResolvedValue({
      availableSlots: [{ startTime: SLOT_ISO, employeeId: 'emp-1', employeeName: 'Ana' }],
    });
    mockAppointments.createAppointment.mockResolvedValue({
      id: 'appt-1',
      status: AppointmentStatus.PENDING,
      startTime: SLOT_ISO,
    });

    const args = { serviceId: SERVICE.id, fecha: '2026-09-25', hora: '10:00', confirmado: false };
    const proposal = await service.execute('registrarCita', args, CTX);
    expect(proposal).toMatchObject({ ok: true, needsConfirmation: true });
    expect(mockAppointments.createAppointment).not.toHaveBeenCalled();

    const done = await service.confirmPending(CTX);
    expect(done.ok).toBe(true);
    expect(mockAppointments.createAppointment).toHaveBeenCalledOnce();
    if (done.ok) expect(done.summary).toContain('registrada');
  });

  it('registrarCita falla si el horario exacto no está libre', async () => {
    mockServices.findById.mockResolvedValue(SERVICE);
    mockAvailability.getAvailableSlots.mockResolvedValue({ availableSlots: [] });
    const result = await service.execute(
      'registrarCita',
      { serviceId: SERVICE.id, fecha: '2026-09-25', hora: '10:00', confirmado: false },
      CTX,
    );
    expect(result).toMatchObject({ ok: false });
  });

  it('cancelarCita impide tocar citas ajenas (identidad del JWT)', async () => {
    mockAppointments.findById.mockResolvedValue({ id: 'appt-x', clientId: 'other-user' });
    const result = await service.execute(
      'cancelarCita',
      { appointmentId: '22222222-2222-4222-8222-222222222222', confirmado: true },
      CTX,
    );
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain('propias');
    expect(mockAppointments.cancelAppointment).not.toHaveBeenCalled();
  });
});
