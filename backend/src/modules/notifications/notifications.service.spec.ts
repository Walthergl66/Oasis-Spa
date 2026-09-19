import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum.js';

describe('NotificationsService (Sprint 4: eventos y recordatorios)', () => {
  let service: NotificationsService;
  let mockSubRepo: any;
  let mockApptRepo: any;
  let mockConfig: any;

  beforeEach(() => {
    mockSubRepo = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn(), delete: vi.fn() };
    mockApptRepo = { find: vi.fn() };
    mockConfig = { get: vi.fn((key: string, def?: string) => def ?? '') };
    service = new NotificationsService(mockSubRepo, mockApptRepo, mockConfig);
    service.onModuleInit();
  });

  it('opera en modo log con claves mock y registra outbox sin suscripciones', async () => {
    expect(service.isPushLive()).toBe(false);
    mockSubRepo.find.mockResolvedValue([]);
    const sent = await service.sendPushToUser('client-1', {
      title: 'Hola',
      body: 'Mundo',
      tag: 'test',
    });
    expect(sent).toBe(0);
    expect(service.getOutbox()).toHaveLength(1);
  });

  it('emite notificación al crear cita', async () => {
    mockSubRepo.find.mockResolvedValue([]);
    await service.handleAppointmentCreated({
      id: 'appt-1',
      clientId: 'client-1',
      startTime: new Date(Date.now() + 86400000),
      service: { name: 'Facial' },
    } as any);
    const outbox = service.getOutbox();
    expect(outbox[0].tag).toBe('appointment.created');
  });

  it('emite notificación al cancelar con motivo', async () => {
    mockSubRepo.find.mockResolvedValue([]);
    await service.handleAppointmentCancelled({
      id: 'appt-2',
      clientId: 'client-1',
      startTime: new Date(Date.now() + 86400000),
      cancellationReason: 'Emergencia',
    } as any);
    expect(service.getOutbox()[0].body).toContain('Emergencia');
  });

  it('el cron recuerda solo citas de las próximas 24h', async () => {
    const now = Date.now();
    mockApptRepo.find.mockResolvedValue([
      { id: 'a1', clientId: 'c1', status: AppointmentStatus.CONFIRMED, startTime: new Date(now + 12 * 3600 * 1000) },
      { id: 'a2', clientId: 'c2', status: AppointmentStatus.CONFIRMED, startTime: new Date(now + 72 * 3600 * 1000) },
      { id: 'a3', clientId: 'c3', status: AppointmentStatus.CANCELLED, startTime: new Date(now + 5 * 3600 * 1000) },
    ]);
    mockSubRepo.find.mockResolvedValue([]);
    const count = await service.sendRemindersForNext24h();
    expect(count).toBe(1);
  });

  it('upsert de suscripción actualiza claves si el endpoint existe', async () => {
    const existing = { id: 's1', userId: 'old', endpoint: 'https://x', p256dh: 'a', auth: 'b', userAgent: null };
    mockSubRepo.findOne.mockResolvedValue(existing);
    mockSubRepo.save.mockImplementation(async (e: any) => e);
    const saved = await service.subscribe('client-1', {
      endpoint: 'https://x',
      keys: { p256dh: 'new', auth: 'new2' },
    });
    expect(saved.userId).toBe('client-1');
    expect(saved.p256dh).toBe('new');
  });
});
