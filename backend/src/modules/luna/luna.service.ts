import { Inject, Injectable } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { PromotionsService } from '../promotions/promotions.service';
import { ServicesService } from '../services/services.service';
import { SpecialistsService } from '../specialists/specialists.service';
import { User } from '../users/entities/user.entity';
import type {
  LunaChatResponse,
  LunaNlu,
  LunaOption,
  LunaNluResult,
} from './luna.types';
import { LUNA_NLU } from './luna.types';
import {
  addDays,
  formatLongDate,
  hoyEnSpa,
  isNo,
  isYes,
  normalize,
  spaNoon,
  toISODate,
  toTime,
  weekdayShort,
} from './luna.util';

type Servicios = Awaited<ReturnType<ServicesService['findAll']>>;

type Step = 'idle' | 'service' | 'date' | 'time' | 'confirm' | 'cancel';

interface CandidataCancelacion {
  id: string;
  serviceName: string;
  start: string;
}

interface FlowState {
  step: Step;
  serviceId?: string;
  date?: string;
  time?: string;
  specialistId?: string;
  cancelCandidates?: CandidataCancelacion[];
}

/**
 * Luna — asistente con ejecución de funciones reales.
 *
 * Cada intención termina invocando un método de los servicios de negocio
 * (catálogo, disponibilidad, reservas, cancelaciones, promociones) y la
 * respuesta se construye con su resultado; por eso la burbuja muestra el
 * `fnTag` de la función ejecutada. La comprensión del mensaje está delegada en
 * `LunaNlu` (hoy basada en reglas, sustituible por un LLM), así que la lógica
 * de negocio es independiente del modelo subyacente.
 *
 * El estado del flujo de reserva vive en memoria, claveado por la clienta (o
 * por un `sessionId` anónimo): tras cada mensaje se persiste y se recupera en
 * el siguiente turno.
 */
@Injectable()
export class LunaService {
  private readonly sessions = new Map<string, FlowState>();

  constructor(
    @Inject(LUNA_NLU) private readonly nlu: LunaNlu,
    private readonly services: ServicesService,
    private readonly appointments: AppointmentsService,
    private readonly promotions: PromotionsService,
    private readonly specialists: SpecialistsService,
  ) {}

  async chat(
    actor: User | null,
    sessionId: string | undefined,
    message: string,
  ): Promise<LunaChatResponse> {
    const key = actor?.id ?? sessionId;
    const state: FlowState = this.sessions.get(key ?? '') ?? { step: 'idle' };

    try {
      if (
        state.step !== 'idle' &&
        /^(cancelar|olvidalo|dejalo)$/i.test(message.trim())
      ) {
        this.reset(state);
        return this.respuesta(
          'Listo, descarté esa solicitud. ¿En qué más puedo ayudarte?',
        );
      }

      const services = await this.services.findAll();
      const parsed = this.nlu.parse(message, { services });

      const reply =
        state.step === 'idle'
          ? await this.startIntent(actor, state, services, parsed)
          : await this.continueFlow(actor, state, services, parsed, message);

      if (key) this.sessions.set(key, state);
      this.podarSesiones();
      return reply;
    } catch (error) {
      this.reset(state);
      return this.respuesta(
        `Ups, algo salió mal: ${(error as Error)?.message ?? 'Ocurrió un error inesperado.'}`,
      );
    }
  }

  // ----------------------------------------------------------- intenciones

  private async startIntent(
    actor: User | null,
    state: FlowState,
    services: Servicios,
    parsed: LunaNluResult,
  ): Promise<LunaChatResponse> {
    switch (parsed.intent) {
      case 'reservar':
        return this.flujoReservar(actor, state, services, parsed);

      case 'precios': {
        const list = services
          .map((s) => `${s.name} — $${s.price} (${s.durationMin} min)`)
          .join('\n');
        return this.respuesta(
          `Estos son nuestros precios:\n${list}\n\n¿Quieres que agende alguno?`,
          {
            fnTag: 'listarServicios()',
            options: services.slice(0, 4).map((s) => ({
              label: `Reservar ${s.name}`,
              value: `Reservar ${s.name}`,
            })),
          },
        );
      }

      case 'promociones': {
        const promos = await this.promotions.findAll();
        if (promos.length === 0) {
          return this.respuesta('Por ahora no tenemos promociones vigentes.', {
            fnTag: 'listarPromociones()',
          });
        }
        const list = promos
          .map(
            (p) =>
              `${p.badge} ${p.title}${p.priceNow != null ? ` — $${p.priceNow}` : ''} (${p.validText})`,
          )
          .join('\n');
        return this.respuesta(
          `Promociones vigentes:\n${list}\n\n¿Te reservo alguna?`,
          {
            fnTag: 'listarPromociones()',
            options: promos.slice(0, 3).map((p) => ({
              label: p.title,
              value: `Reservar ${p.title}`,
            })),
          },
        );
      }

      case 'mis-citas': {
        if (!actor) return this.needLogin(state);
        const upcoming = await this.appointments.findForClient(
          actor.id,
          'upcoming',
        );
        if (upcoming.length === 0) {
          return this.respuesta(
            'No tienes citas próximas. ¿Quieres que agende una?',
            {
              fnTag: 'consultarMisCitas()',
              options: [{ label: 'Sí, reservar', value: 'Quiero reservar' }],
            },
          );
        }
        const list = upcoming
          .map(
            (a) =>
              `• ${a.serviceName} — ${formatLongDate(a.start)} a las ${toTime(a.start)} con ${a.specialistName}`,
          )
          .join('\n');
        return this.respuesta(
          `Tienes ${upcoming.length} cita(s) próxima(s):\n${list}`,
          { fnTag: 'consultarMisCitas()' },
        );
      }

      case 'cancelar': {
        if (!actor) return this.needLogin(state);
        const upcoming = await this.appointments.findForClient(
          actor.id,
          'upcoming',
        );
        if (upcoming.length === 0) {
          return this.respuesta('No encuentro citas activas para cancelar.', {
            fnTag: 'consultarMisCitas()',
          });
        }
        state.step = 'cancel';
        state.cancelCandidates = upcoming.map((a) => ({
          id: a.id,
          serviceName: a.serviceName,
          start: a.start,
        }));
        return this.respuesta('¿Cuál cita deseas cancelar?', {
          fnTag: 'consultarMisCitas()',
          options: upcoming.map((a, i) => ({
            label: `${a.serviceName} · ${weekdayShort(a.start)} ${toTime(a.start)}`,
            value: String(i + 1),
          })),
        });
      }

      case 'horarios':
        return this.respuesta(
          'Atendemos de lunes a sábado de 09:00 a 18:00 y los domingos de 10:00 a 14:00. ¿Para qué día quieres reservar?',
          {
            options: [
              { label: 'Hoy', value: 'hoy' },
              { label: 'Mañana', value: 'mañana' },
              { label: 'El sábado', value: 'el sábado' },
            ],
          },
        );

      case 'especialistas': {
        const specialists = await this.specialists.findAll();
        const list = specialists
          .map((s) => `${s.name} — ${s.role} (★ ${s.rating})`)
          .join('\n');
        return this.respuesta(
          `Nuestro equipo:\n${list}\n\n¿Con quién te gustaría agendar?`,
          { fnTag: 'listarEspecialistas()' },
        );
      }

      case 'saludo':
        return this.greeting(actor?.name.split(' ')[0]);

      default:
        return this.respuesta(
          'Puedo agendar una cita, consultar tus reservas, revisar precios o promociones. ¿Qué prefieres?',
          {
            options: [
              { label: 'Reservar una cita', value: 'Quiero reservar' },
              { label: 'Mis citas', value: 'Mis citas' },
              { label: 'Promociones', value: 'Promociones' },
            ],
          },
        );
    }
  }

  /** Entrada al flujo de reserva: servicio → fecha → hora → confirmación. */
  private async flujoReservar(
    actor: User | null,
    state: FlowState,
    services: Servicios,
    parsed: LunaNluResult,
  ): Promise<LunaChatResponse> {
    const service = services.find((s) => s.name === parsed.serviceName);
    if (!service) {
      state.step = 'service';
      return this.respuesta('Con gusto. ¿Qué servicio te gustaría reservar?', {
        fnTag: 'listarServicios()',
        options: services.slice(0, 6).map((s) => ({
          label: `${s.name} · $${s.price}`,
          value: s.name,
        })),
      });
    }

    state.step = 'date';
    state.serviceId = service.id;
    if (parsed.date) return this.askTime(state, service, parsed.date);
    return this.askDate(service);
  }

  // ------------------------------------------------------------ flujo de cita

  private async continueFlow(
    actor: User | null,
    state: FlowState,
    services: Servicios,
    parsed: LunaNluResult,
    message: string,
  ): Promise<LunaChatResponse> {
    switch (state.step) {
      case 'service': {
        const service = services.find((s) => s.name === parsed.serviceName);
        if (!service) {
          return this.respuesta(
            'No identifiqué ese servicio. Elige uno de la lista, por favor.',
            {
              options: services.map((s) => ({ label: s.name, value: s.name })),
            },
          );
        }
        state.step = 'date';
        state.serviceId = service.id;
        if (parsed.date) return this.askTime(state, service, parsed.date);
        return this.askDate(service);
      }

      case 'date': {
        const service = services.find((s) => s.id === state.serviceId);
        if (!service) {
          return this.askDate(
            undefined,
            'Ese servicio ya no está disponible. ',
          );
        }
        if (!parsed.date) return this.askDate(service, 'No entendí la fecha. ');
        return this.askTime(state, service, parsed.date);
      }

      case 'time': {
        const service = services.find((s) => s.id === state.serviceId);
        if (!service)
          return this.respuesta('Ese servicio ya no está disponible.');
        const time = parsed.time;
        if (!time) {
          return this.respuesta(
            'Dime la hora en formato 24 h, por ejemplo 10:00 o 15:30.',
          );
        }

        const availability = await this.appointments.getAvailability(
          state.serviceId!,
          state.date!,
        );
        const slot = availability.slots.find((s) => s.time === time);

        if (!slot || !slot.available) {
          const free = availability.slots
            .filter((s) => s.available)
            .slice(0, 6);
          if (free.length === 0) {
            state.step = 'date';
            return this.respuesta(
              `No queda disponibilidad de ${service.name} ese día. ¿Probamos con otra fecha?`,
              {
                fnTag: `consultarDisponibilidad("${service.name}", "${state.date}")`,
                options: this.dateOptions(),
              },
            );
          }
          return this.respuesta(
            `Las ${time} ya están ocupadas. Te quedan estos horarios ese día:`,
            {
              fnTag: `consultarDisponibilidad("${service.name}", "${state.date}")`,
              options: free.map((s) => ({ label: s.time, value: s.time })),
            },
          );
        }

        const specialist = await this.specialists.getEntity(
          slot.specialistIds[0],
        );
        state.step = 'confirm';
        state.time = time;
        state.specialistId = specialist.id;

        return this.respuesta(
          `${specialist.name} está disponible. ¿Confirmo tu cita de ${service.name} el ${formatLongDate(spaNoon(state.date!))} a las ${time}? Son $${service.price} y dura ${service.durationMin} min.`,
          {
            fnTag: `consultarDisponibilidad("${service.name}", "${state.date}") → disponible`,
            options: [
              { label: 'Sí, confirmar', value: 'sí' },
              { label: 'No', value: 'no' },
            ],
          },
        );
      }

      case 'confirm': {
        if (isNo(message)) {
          this.reset(state);
          return this.respuesta(
            'Sin problema, no reservé nada. ¿Quieres ver otro horario?',
          );
        }
        if (!isYes(message)) {
          return this.respuesta(
            '¿Confirmo la cita? Respóndeme sí o no, por favor.',
          );
        }
        if (!actor) return this.needLogin(state);

        const service = services.find((s) => s.id === state.serviceId);
        const { date, time } = state;
        const appointment = await this.appointments.create(
          {
            clientId: actor.id,
            serviceId: state.serviceId!,
            date: date!,
            time: time!,
            specialistId: state.specialistId,
            notes: 'Reserva agendada por Luna',
          },
          actor,
        );
        this.reset(state);

        return this.respuesta(
          `¡Cita confirmada! ${appointment.serviceName} el ${formatLongDate(appointment.start)} a las ${toTime(appointment.start)} con ${appointment.specialistName}. La verás en "Mis Reservas". 🌿`,
          {
            fnTag: `registrarCita("${service?.name ?? ''}", "${date} ${time}") → ${appointment.id}`,
            mutated: true,
          },
        );
      }

      case 'cancel': {
        if (!actor) return this.needLogin(state);
        const candidates = state.cancelCandidates ?? [];
        const elegido =
          parsed.index !== undefined && candidates[parsed.index]
            ? candidates[parsed.index]
            : candidates.find((c) =>
                normalize(message).includes(normalize(c.serviceName)),
              );
        if (!elegido) {
          return this.respuesta(
            'No identifiqué la cita. Dime el número de la lista, por favor.',
          );
        }

        const cancelled = await this.appointments.cancel(
          elegido.id,
          'Cancelada desde el chat con Luna',
          actor,
        );
        this.reset(state);
        return this.respuesta(
          `Cancelé tu cita de ${cancelled.serviceName}. Cuando quieras te agendo otra.`,
          { fnTag: `cancelarCita("${cancelled.id}")`, mutated: true },
        );
      }

      default:
        return this.respuesta('¿En qué más puedo ayudarte?');
    }
  }

  private askDate(service?: Servicios[number], prefix = ''): LunaChatResponse {
    return this.respuesta(
      service
        ? `${prefix}Perfecto, ${service.name} ($${service.price} · ${service.durationMin} min). ¿Qué día te queda bien?`
        : `${prefix}¿Qué día te queda bien?`,
      { options: this.dateOptions() },
    );
  }

  private async askTime(
    state: FlowState,
    service: Servicios[number],
    date: string,
  ): Promise<LunaChatResponse> {
    const availability = await this.appointments.getAvailability(
      service.id,
      date,
    );
    const free = availability.slots.filter((s) => s.available);
    state.step = 'time';
    state.date = date;

    if (free.length === 0) {
      state.step = 'date';
      return this.respuesta(
        `No hay horarios libres de ${service.name} el ${formatLongDate(spaNoon(date))}. ¿Probamos otro día?`,
        {
          fnTag: `consultarDisponibilidad("${service.name}", "${date}") → 0 horarios`,
          options: this.dateOptions(),
        },
      );
    }

    return this.respuesta(
      `Para el ${formatLongDate(spaNoon(date))} tengo estos horarios disponibles. ¿Cuál prefieres?`,
      {
        fnTag: `consultarDisponibilidad("${service.name}", "${date}") → ${free.length} horarios`,
        options: free
          .slice(0, 8)
          .map((s) => ({ label: s.time, value: s.time })),
      },
    );
  }

  // --------------------------------------------------------------- utilidades

  private greeting(name?: string): LunaChatResponse {
    return this.respuesta(
      name
        ? `¡Hola, ${name}! Soy Luna, tu asistente de Oasis Spa. Puedo consultar horarios y agendar tu cita directamente. ¿Qué necesitas?`
        : '¡Hola! Soy Luna, la asistente de Oasis Spa. Puedo mostrarte servicios y promociones, y agendar tu cita si inicias sesión. ¿Qué te gustaría?',
      {
        options: [
          { label: 'Quiero reservar', value: 'Quiero reservar' },
          { label: 'Ver promociones', value: 'Ver promociones' },
          { label: 'Precios', value: 'Precios' },
        ],
      },
    );
  }

  private needLogin(state: FlowState): LunaChatResponse {
    this.reset(state);
    return this.respuesta(
      'Para agendar o consultar tus citas necesito que inicies sesión. Puedes hacerlo desde el botón "Ingresar" del menú.',
    );
  }

  private reset(state: FlowState): void {
    state.step = 'idle';
    state.serviceId = undefined;
    state.date = undefined;
    state.time = undefined;
    state.specialistId = undefined;
    state.cancelCandidates = undefined;
  }

  private respuesta(
    text: string,
    extra: Partial<Omit<LunaChatResponse, 'text' | 'sessionId'>> = {},
  ): LunaChatResponse {
    return { text, ...extra };
  }

  private dateOptions(): LunaOption[] {
    const hoy = hoyEnSpa();
    return Array.from({ length: 5 }, (_, i) => {
      const day = addDays(hoy, i);
      const label =
        i === 0
          ? 'Hoy'
          : i === 1
            ? 'Mañana'
            : `${weekdayShort(day.toISOString())} ${day.getDate()}`;
      return { label, value: toISODate(day) };
    });
  }

  /** Evita que el mapa de sesiones crezca sin límite. */
  private podarSesiones(): void {
    if (this.sessions.size > 2000) this.sessions.clear();
  }
}
