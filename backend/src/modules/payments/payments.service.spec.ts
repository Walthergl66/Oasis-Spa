import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentsService } from './payments.service.js';
import { PaymentMethod, PaymentStatus } from './entities/payment.entity.js';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum.js';

const APPT_ID = '11111111-1111-4111-8111-111111111111';

describe('PaymentsService (Sprint 7: anticipos)', () => {
  let service: PaymentsService;
  let mockRepo: any;
  let mockAppointments: any;

  beforeEach(() => {
    mockRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockAppointments = { findById: vi.fn() };
    service = new PaymentsService(mockRepo, mockAppointments);
  });

  it('registra anticipo en cita activa', async () => {
    mockAppointments.findById.mockResolvedValue({ id: APPT_ID, status: AppointmentStatus.CONFIRMED });
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.create.mockImplementation((dto: any) => ({ id: 'pay-1', ...dto }));
    mockRepo.save.mockImplementation(async (e: any) => e);

    const payment = await service.register('admin-1', {
      appointmentId: APPT_ID,
      amount: 20,
      method: PaymentMethod.EFECTIVO,
    });
    expect(payment.status).toBe(PaymentStatus.REGISTRADO);
    expect(payment.receivedById).toBe('admin-1');
  });

  it('rechaza duplicado activo y citas canceladas', async () => {
    mockAppointments.findById.mockResolvedValue({ id: APPT_ID, status: AppointmentStatus.CONFIRMED });
    mockRepo.findOne.mockResolvedValue({ id: 'pay-old', status: PaymentStatus.REGISTRADO });
    await expect(
      service.register('admin-1', { appointmentId: APPT_ID, amount: 20, method: PaymentMethod.TARJETA }),
    ).rejects.toThrow('ya tiene un anticipo');

    mockAppointments.findById.mockResolvedValue({ id: APPT_ID, status: AppointmentStatus.CANCELLED });
    mockRepo.findOne.mockResolvedValue(null);
    await expect(
      service.register('admin-1', { appointmentId: APPT_ID, amount: 20, method: PaymentMethod.EFECTIVO }),
    ).rejects.toThrow('cancelada');
  });

  it('anula y rechaza doble anulación', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.REGISTRADO });
    mockRepo.save.mockImplementation(async (e: any) => e);
    const annulled = await service.annul('pay-1');
    expect(annulled.status).toBe(PaymentStatus.ANULADO);

    mockRepo.findOne.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.ANULADO });
    await expect(service.annul('pay-1')).rejects.toThrow('ya fue anulado');
  });
});
