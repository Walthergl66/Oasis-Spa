import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor.js';

/**
 * Flujos completos (Sprint 8): registro, login, catálogo, agenda,
 * disponibilidad, reserva, doble reserva, asistente, cancelación,
 * dashboard y anticipos. REQUIERE PostgreSQL (docker compose up).
 * Se omite automáticamente sin DB (CI la provee).
 */
describe('Flujos completos (e2e, requiere DB)', () => {
  let app: INestApplication<App>;
  let dbUp = false;

  const tag = Date.now();
  const clientEmail = `e2e.client.${tag}@oasisspa.com`;
  const empEmail = `e2e.emp.${tag}@oasisspa.com`;
  const password = 'E2ePassword123*';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@oasisspa.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234*';

  let clientToken = '';
  let adminToken = '';
  let serviceId = '';
  let employeeId = '';
  let slotStart = '';
  let appointmentId = '';
  let secondAppointmentId = '';

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      app.useGlobalInterceptors(new TransformInterceptor());
      await app.init();
      dbUp = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`E2E con DB omitido (sin PostgreSQL): ${String(error).split('\n')[0]}`);
    }
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  const dataOf = (res: request.Response) => res.body?.data ?? res.body;

  it('registra cliente y admin inicia sesión', async () => {
    if (!dbUp) return;
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: clientEmail, password, firstName: 'E2E', lastName: 'Client' })
      .expect(201);
    clientToken = dataOf(register).tokens.accessToken;
    expect(clientToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    adminToken = dataOf(login).tokens.accessToken;
    expect(adminToken).toBeDefined();
  });

  it('admin crea servicio y aparece en catálogo público', async () => {
    if (!dbUp) return;
    const created = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `E2E Masaje ${tag}`,
        description: 'Servicio creado por el flujo E2E',
        durationMinutes: 60,
        price: 45,
        category: 'E2E',
      })
      .expect(201);
    serviceId = dataOf(created).id;
    expect(serviceId).toBeDefined();

    const catalog = await request(app.getHttpServer())
      .get('/api/v1/services/active')
      .expect(200);
    expect(JSON.stringify(dataOf(catalog))).toContain(`E2E Masaje ${tag}`);
  });

  it('admin crea perfil de especialista para el servicio', async () => {
    if (!dbUp) return;
    const empUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: empEmail, password, firstName: 'E2E', lastName: 'Therapist' })
      .expect(201);
    const empUserId = dataOf(empUser).user.id;

    const employee = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: empUserId, specialty: 'E2E', serviceIds: [serviceId] })
      .expect(201);
    employeeId = dataOf(employee).id;
    expect(employeeId).toBeDefined();
  });

  it('disponibilidad pública devuelve slots en los próximos 7 días', async () => {
    if (!dbUp) return;
    for (let offset = 1; offset <= 7; offset += 1) {
      const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const res = await request(app.getHttpServer()).get(
        `/api/v1/availability?serviceId=${serviceId}&date=${date}`,
      );
      if (res.status !== 200) continue;
      const slots = (dataOf(res).availableSlots ?? []).filter(
        (s: { employeeId: string }) => s.employeeId === employeeId,
      );
      if (slots.length > 0) {
        slotStart = slots[0].startTime;
        break;
      }
    }
    expect(slotStart).not.toBe('');
  });

  it('cliente reserva y la doble reserva se rechaza (409)', async () => {
    if (!dbUp) return;
    const booked = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ serviceId, employeeId, startTime: slotStart })
      .expect(201);
    appointmentId = dataOf(booked).id;
    expect(dataOf(booked).status).toBe('PENDING');

    await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ serviceId, employeeId, startTime: slotStart })
      .expect(409);
  });

  it('asistente responde con el catálogo real vía tools', async () => {
    if (!dbUp) return;
    const chat = await request(app.getHttpServer())
      .post('/api/v1/assistant/chat')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ message: '¿Qué servicios tienen?' })
      .expect(201);
    expect(dataOf(chat).reply).toContain(`E2E Masaje ${tag}`);
  });

  it('cliente cancela su cita', async () => {
    if (!dbUp) return;
    const cancelled = await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({})
      .expect(200);
    expect(dataOf(cancelled).status).toBe('CANCELLED');
  });

  it('dashboard admin refleja el movimiento', async () => {
    if (!dbUp) return;
    const summary = await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(dataOf(summary).total).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
  });

  it('anticipo se registra una sola vez por cita', async () => {
    if (!dbUp) return;
    const booked = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ serviceId, employeeId, startTime: slotStart })
      .expect(201);
    secondAppointmentId = dataOf(booked).id;

    await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ appointmentId: secondAppointmentId, amount: 20, method: 'EFECTIVO' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ appointmentId: secondAppointmentId, amount: 20, method: 'EFECTIVO' })
      .expect(409);
  });
});
