/**
 * Citas y disponibilidad — el núcleo funcional del sistema.
 *
 * La lógica de disponibilidad (horario del spa, duración del servicio, solapes
 * por especialista) vive aquí y es la misma que implementará el módulo
 * `appointments` de NestJS. Luna consume estas mismas funciones, no una copia.
 */
import { ApiError, request } from '../api/http';
import { clone, db, mutate, newId } from '../api/localDb';
import type {
  Appointment, AppointmentStatus, Availability, AvailabilitySlot, CreateAppointmentInput, DbAppointmentFilter,
} from '../types';
import { addMinutes, isSameDay, parseDateTime, toISODate, toTime } from '../utils/date';
import { levelForPoints, pointsForPrice } from '../utils/loyalty';

/** Horario de atención del spa por día de la semana (0 = domingo). */
export const BUSINESS_HOURS: Record<number, { open: string; close: string } | null> = {
  0: { open: '10:00', close: '14:00' },
  1: { open: '09:00', close: '18:00' },
  2: { open: '09:00', close: '18:00' },
  3: { open: '09:00', close: '18:00' },
  4: { open: '09:00', close: '18:00' },
  5: { open: '09:00', close: '18:00' },
  6: { open: '09:00', close: '18:00' },
};

/** Granularidad de la agenda, en minutos. */
export const SLOT_MINUTES = 30;

const ACTIVE_STATUSES: AppointmentStatus[] = ['pendiente', 'confirmada'];

function minutesOfDay(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function timeFromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function overlaps(startA: Date, durationA: number, startB: Date, durationB: number): boolean {
  const endA = addMinutes(startA, durationA).getTime();
  const endB = addMinutes(startB, durationB).getTime();
  return startA.getTime() < endB && startB.getTime() < endA;
}

/** Citas que ocupan agenda ese día (las canceladas liberan el horario). */
function busyOn(date: string, excludeId?: string): Appointment[] {
  return db().appointments.filter(
    a => a.id !== excludeId && ACTIVE_STATUSES.includes(a.status) && isSameDay(a.start, parseDateTime(date, '12:00')),
  );
}

function specialistIsFree(specialistId: string, start: Date, durationMin: number, date: string, excludeId?: string): boolean {
  return !busyOn(date, excludeId).some(
    a => a.specialistId === specialistId && overlaps(start, durationMin, new Date(a.start), a.durationMin),
  );
}

/** Calcula los horarios de un día para un servicio concreto. */
function computeAvailability(serviceId: string, date: string, excludeAppointmentId?: string): Availability {
  const data = db();
  const service = data.services.find(s => s.id === serviceId);
  if (!service) throw new ApiError('El servicio no existe.', 'NOT_FOUND');

  const reference = parseDateTime(date, '12:00');
  const hours = BUSINESS_HOURS[reference.getDay()];
  if (!hours) return { date, serviceId, slots: [] };

  const candidates = data.specialists.filter(
    s => s.active && s.status !== 'Descanso' && s.categories.includes(service.category),
  );

  const slots: AvailabilitySlot[] = [];
  const open = minutesOfDay(hours.open);
  const close = minutesOfDay(hours.close);
  const now = new Date();

  for (let m = open; m + service.durationMin <= close; m += SLOT_MINUTES) {
    const time = timeFromMinutes(m);
    const start = parseDateTime(date, time);
    // Un horario que ya pasó no se ofrece.
    const inPast = start.getTime() <= now.getTime();
    const free = inPast
      ? []
      : candidates
          .filter(s => specialistIsFree(s.id, start, service.durationMin, date, excludeAppointmentId))
          .map(s => s.id);
    slots.push({ time, available: free.length > 0, specialistIds: free });
  }

  return { date, serviceId, slots };
}

function notify(userId: string, icon: string, title: string, text: string): void {
  mutate(data => {
    data.notifications.unshift({
      id: newId('ntf'), userId, icon, title, text, createdAt: new Date().toISOString(), read: false,
    });
  });
}

function sortByStart(list: Appointment[], direction: 'asc' | 'desc' = 'asc'): Appointment[] {
  return [...list].sort((a, b) =>
    direction === 'asc'
      ? new Date(a.start).getTime() - new Date(b.start).getTime()
      : new Date(b.start).getTime() - new Date(a.start).getTime(),
  );
}

export const appointmentsService = {
  /**
   * GET /appointments/availability?serviceId=&date=
   * Devuelve cada franja del día con las especialistas libres. Es la función
   * que Luna invoca cuando la clienta pregunta por un horario.
   */
  getAvailability: (serviceId: string, date: string, excludeAppointmentId?: string): Promise<Availability> =>
    request({
      method: 'get',
      path: '/appointments/availability',
      params: { serviceId, date, excludeAppointmentId },
      mock: () => computeAvailability(serviceId, date, excludeAppointmentId),
    }),

  /** GET /appointments (admin) */
  list: (filter: DbAppointmentFilter = {}): Promise<Appointment[]> =>
    request({
      method: 'get',
      path: '/appointments',
      params: filter as Record<string, string | undefined>,
      mock: () => {
        let list = db().appointments;
        if (filter.status) list = list.filter(a => a.status === filter.status);
        if (filter.date) list = list.filter(a => isSameDay(a.start, parseDateTime(filter.date!, '12:00')));
        if (filter.specialistId) list = list.filter(a => a.specialistId === filter.specialistId);
        if (filter.clientId) list = list.filter(a => a.clientId === filter.clientId);
        return clone(sortByStart(list));
      },
    }),

  /** GET /appointments/:id */
  getById: (id: string): Promise<Appointment> =>
    request({
      method: 'get',
      path: `/appointments/${id}`,
      mock: () => {
        const found = db().appointments.find(a => a.id === id);
        if (!found) throw new ApiError('La cita no existe.', 'NOT_FOUND');
        return clone(found);
      },
    }),

  /** GET /appointments/user/:clientId — próximas y activas. */
  getUpcoming: (clientId: string): Promise<Appointment[]> =>
    request({
      method: 'get',
      path: `/appointments/user/${clientId}`,
      params: { scope: 'upcoming' },
      mock: () =>
        clone(
          sortByStart(
            db().appointments.filter(
              a => a.clientId === clientId && ACTIVE_STATUSES.includes(a.status) && new Date(a.start).getTime() >= Date.now(),
            ),
          ),
        ),
    }),

  /** GET /appointments/user/:clientId?scope=history */
  getHistory: (clientId: string): Promise<Appointment[]> =>
    request({
      method: 'get',
      path: `/appointments/user/${clientId}`,
      params: { scope: 'history' },
      mock: () =>
        clone(
          sortByStart(
            db().appointments.filter(
              a =>
                a.clientId === clientId &&
                (a.status === 'completada' || a.status === 'cancelada' || new Date(a.start).getTime() < Date.now()),
            ),
            'desc',
          ),
        ),
    }),

  /** GET /appointments?date= — agenda del día para el administrador. */
  getAgenda: (date: string): Promise<Appointment[]> =>
    request({
      method: 'get',
      path: '/appointments',
      params: { date },
      mock: () =>
        clone(sortByStart(db().appointments.filter(a => isSameDay(a.start, parseDateTime(date, '12:00'))))),
    }),

  /**
   * POST /appointments
   * Valida disponibilidad antes de registrar; si no se indica especialista,
   * asigna la que tenga menos carga ese día.
   */
  create: (input: CreateAppointmentInput): Promise<Appointment> =>
    request({
      method: 'post',
      path: '/appointments',
      body: input,
      mock: () => {
        const data = db();
        const service = data.services.find(s => s.id === input.serviceId);
        if (!service) throw new ApiError('El servicio no existe.', 'NOT_FOUND');
        const client = data.users.find(u => u.id === input.clientId);
        if (!client) throw new ApiError('La clienta no existe.', 'NOT_FOUND');

        const availability = computeAvailability(input.serviceId, input.date);
        const slot = availability.slots.find(s => s.time === input.time);
        if (!slot) throw new ApiError('Ese horario está fuera del horario de atención.', 'INVALID_SLOT');
        if (!slot.available) throw new ApiError('Ese horario ya está reservado. Elige otro, por favor.', 'SLOT_TAKEN');

        let specialistId = input.specialistId;
        if (specialistId && !slot.specialistIds.includes(specialistId)) {
          throw new ApiError('Esa especialista no está disponible en ese horario.', 'SPECIALIST_BUSY');
        }
        if (!specialistId) {
          const load = (id: string) => busyOn(input.date).filter(a => a.specialistId === id).length;
          specialistId = [...slot.specialistIds].sort((a, b) => load(a) - load(b))[0];
        }
        const specialist = data.specialists.find(s => s.id === specialistId)!;
        const start = parseDateTime(input.date, input.time);

        const appointment: Appointment = {
          id: newId('apt'),
          clientId: client.id, clientName: client.name,
          serviceId: service.id, serviceName: service.name,
          specialistId: specialist.id, specialistName: specialist.name,
          start: start.toISOString(),
          durationMin: service.durationMin,
          price: service.price,
          status: 'confirmada',
          notes: input.notes?.trim() ?? '',
          createdAt: new Date().toISOString(),
          reviewed: false,
        };

        mutate(store => store.appointments.push(appointment));
        notify(
          client.id, '✓', 'Reserva confirmada',
          `${service.name} el ${start.toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })} a las ${toTime(start)} con ${specialist.name}.`,
        );
        return clone(appointment);
      },
    }),

  /** PATCH /appointments/:id/reschedule */
  reschedule: (id: string, date: string, time: string, specialistId?: string): Promise<Appointment> =>
    request({
      method: 'patch',
      path: `/appointments/${id}/reschedule`,
      body: { date, time, specialistId },
      mock: () => {
        const data = db();
        const appointment = data.appointments.find(a => a.id === id);
        if (!appointment) throw new ApiError('La cita no existe.', 'NOT_FOUND');
        if (appointment.status === 'cancelada' || appointment.status === 'completada') {
          throw new ApiError('Sólo se pueden reprogramar citas activas.', 'INVALID_STATUS');
        }

        const availability = computeAvailability(appointment.serviceId, date, id);
        const slot = availability.slots.find(s => s.time === time);
        if (!slot?.available) throw new ApiError('Ese horario ya no está disponible.', 'SLOT_TAKEN');

        const nextSpecialistId =
          specialistId && slot.specialistIds.includes(specialistId)
            ? specialistId
            : slot.specialistIds.includes(appointment.specialistId)
              ? appointment.specialistId
              : slot.specialistIds[0];
        const specialist = data.specialists.find(s => s.id === nextSpecialistId)!;
        const start = parseDateTime(date, time);

        const updated = mutate(store => {
          const target = store.appointments.find(a => a.id === id)!;
          target.start = start.toISOString();
          target.specialistId = specialist.id;
          target.specialistName = specialist.name;
          target.status = 'confirmada';
          return clone(target);
        });

        notify(
          updated.clientId, '📅', 'Cita reprogramada',
          `${updated.serviceName} quedó para el ${start.toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })} a las ${time}.`,
        );
        return updated;
      },
    }),

  /** PATCH /appointments/:id/cancel */
  cancel: (id: string, reason = ''): Promise<Appointment> =>
    request({
      method: 'patch',
      path: `/appointments/${id}/cancel`,
      body: { reason },
      mock: () => {
        const updated = mutate(data => {
          const appointment = data.appointments.find(a => a.id === id);
          if (!appointment) throw new ApiError('La cita no existe.', 'NOT_FOUND');
          if (appointment.status === 'completada') throw new ApiError('Una cita completada no se puede cancelar.', 'INVALID_STATUS');
          appointment.status = 'cancelada';
          if (reason) appointment.notes = appointment.notes ? `${appointment.notes} · Motivo: ${reason}` : `Motivo: ${reason}`;
          return clone(appointment);
        });
        notify(updated.clientId, '✕', 'Cita cancelada', `Tu cita de ${updated.serviceName} fue cancelada. Puedes reservar otra cuando quieras.`);
        return updated;
      },
    }),

  /**
   * PATCH /appointments/:id/status (admin)
   * Al completar una cita se acreditan los puntos de fidelidad de la clienta.
   */
  updateStatus: (id: string, status: AppointmentStatus): Promise<Appointment> =>
    request({
      method: 'patch',
      path: `/appointments/${id}/status`,
      body: { status },
      mock: () =>
        mutate(data => {
          const appointment = data.appointments.find(a => a.id === id);
          if (!appointment) throw new ApiError('La cita no existe.', 'NOT_FOUND');
          const wasCompleted = appointment.status === 'completada';
          appointment.status = status;

          if (status === 'completada' && !wasCompleted) {
            const client = data.users.find(u => u.id === appointment.clientId);
            if (client) {
              client.points += pointsForPrice(appointment.price);
              client.level = levelForPoints(client.points);
              data.notifications.unshift({
                id: newId('ntf'), userId: client.id, icon: '⭐', title: '¡Ganaste puntos!',
                text: `Sumaste ${pointsForPrice(appointment.price)} puntos por tu visita. Ya tienes ${client.points} pts.`,
                createdAt: new Date().toISOString(), read: false,
              });
            }
          }
          return clone(appointment);
        }),
    }),

  /** PATCH /appointments/:id — edición libre desde el panel administrativo. */
  update: (id: string, changes: Partial<Pick<Appointment, 'notes' | 'status'>>): Promise<Appointment> =>
    request({
      method: 'patch',
      path: `/appointments/${id}`,
      body: changes,
      mock: () =>
        mutate(data => {
          const appointment = data.appointments.find(a => a.id === id);
          if (!appointment) throw new ApiError('La cita no existe.', 'NOT_FOUND');
          Object.assign(appointment, changes);
          return clone(appointment);
        }),
    }),
};

/** Devuelve la fecha (YYYY-MM-DD) de una cita, útil para prellenar formularios. */
export function appointmentDate(appointment: Appointment): string {
  return toISODate(new Date(appointment.start));
}

export function appointmentTime(appointment: Appointment): string {
  return toTime(appointment.start);
}
