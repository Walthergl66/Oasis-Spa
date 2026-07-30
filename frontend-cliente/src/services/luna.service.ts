/**
 * Luna — asistente virtual con ejecución de funciones.
 *
 * Luna NO responde texto genérico ni redirige a la clienta a navegar: interpreta
 * la intención, invoca las funciones reales del sistema (las mismas que usa la
 * interfaz: disponibilidad, creación y cancelación de citas) y responde con el
 * resultado de esa ejecución. Cada llamada queda marcada con `fnTag`, que la
 * burbuja del chat muestra como evidencia de la función ejecutada.
 *
 * Fase 3 del proyecto: `LunaSession.handle()` pasará a hacer POST /luna/chat y
 * será NestJS quien decida (vía tool use del modelo) qué función ejecutar. El
 * catálogo de herramientas de más abajo es exactamente el que se declarará allí.
 */
import { errorMessage } from '../api/http';
import type { Appointment, Service, User } from '../types';
import { addDays, formatLongDate, toISODate, toTime, weekdayShort } from '../utils/date';
import { appointmentsService } from './appointments.service';
import { promotionsService } from './promotions.service';
import { servicesService } from './services.service';
import { specialistsService } from './specialists.service';

export interface LunaOption {
  label: string;
  value: string;
}

export interface LunaMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
  /** Nombre de la función del backend que se ejecutó para producir el mensaje. */
  fnTag?: string;
  options?: LunaOption[];
  /** true cuando la respuesta cambió datos y las vistas deben refrescarse. */
  mutated?: boolean;
}

/** Catálogo de funciones que Luna puede ejecutar (futuras tools de NestJS). */
export const LUNA_TOOLS = [
  { name: 'listarServicios', description: 'Lista el catálogo de servicios con precio y duración.' },
  { name: 'consultarDisponibilidad', description: 'Consulta los horarios libres de un servicio en una fecha.' },
  { name: 'registrarCita', description: 'Registra una cita para la clienta autenticada.' },
  { name: 'consultarMisCitas', description: 'Devuelve las próximas citas de la clienta.' },
  { name: 'cancelarCita', description: 'Cancela una cita activa de la clienta.' },
  { name: 'listarPromociones', description: 'Lista las promociones vigentes.' },
] as const;

type Step = 'idle' | 'service' | 'date' | 'time' | 'confirm' | 'cancel';

interface FlowState {
  step: Step;
  serviceId?: string;
  date?: string;
  time?: string;
  specialistId?: string;
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Minúsculas y sin tildes, para comparar lo que escribe la clienta. */
const normalize = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function detectIntent(text: string): 'reservar' | 'precios' | 'horarios' | 'especialistas' | 'promociones' | 'mis-citas' | 'cancelar' | 'saludo' | 'desconocido' {
  const t = normalize(text);
  if (/(cancel|anul)/.test(t)) return 'cancelar';
  if (/(mis citas|mis reservas|que tengo|tengo cita|proxima cita)/.test(t)) return 'mis-citas';
  if (/(reserv|agend|cita|quiero un|separar)/.test(t)) return 'reservar';
  if (/(precio|cuesta|vale|tarifa|cuanto)/.test(t)) return 'precios';
  if (/(horario|abren|cierran|atienden)/.test(t)) return 'horarios';
  if (/(especialista|quien me atiende|estilista)/.test(t)) return 'especialistas';
  if (/(promo|descuento|oferta)/.test(t)) return 'promociones';
  if (/^(hola|buenas|buenos dias|hey|que tal)/.test(t)) return 'saludo';
  return 'desconocido';
}

function matchService(services: Service[], text: string): Service | undefined {
  const t = normalize(text);
  return (
    services.find(s => t.includes(normalize(s.name))) ??
    services.find(s => normalize(s.name).split(' ').some(word => word.length > 4 && t.includes(word))) ??
    services.find(s => t.includes(normalize(s.category)))
  );
}

/** Interpreta 'hoy', 'mañana', 'el sábado', '25 de julio', '25/07' o '25'. */
function parseDate(text: string): string | null {
  const t = normalize(text);
  const today = new Date();

  if (/\bhoy\b/.test(t)) return toISODate(today);
  if (/pasado ?manana/.test(t)) return toISODate(addDays(today, 2));
  if (/\bmanana\b/.test(t)) return toISODate(addDays(today, 1));

  const weekdayIndex = WEEKDAYS.findIndex(d => t.includes(normalize(d)));
  if (weekdayIndex >= 0) {
    for (let i = 1; i <= 7; i++) {
      const candidate = addDays(today, i);
      if (candidate.getDay() === weekdayIndex) return toISODate(candidate);
    }
  }

  const slash = t.match(/(\d{1,2})[/-](\d{1,2})/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    const year = today.getFullYear() + (month < today.getMonth() ? 1 : 0);
    return toISODate(new Date(year, month, day));
  }

  const dayMonth = t.match(/(\d{1,2})\s*(?:de\s*)?([a-z]+)/);
  if (dayMonth) {
    const month = MONTHS.findIndex(m => normalize(m) === dayMonth[2]);
    if (month >= 0) {
      const day = Number(dayMonth[1]);
      const year = today.getFullYear() + (month < today.getMonth() ? 1 : 0);
      return toISODate(new Date(year, month, day));
    }
  }

  const bare = t.match(/\b(\d{1,2})\b/);
  if (bare && !/:/.test(t)) {
    const day = Number(bare[1]);
    if (day >= 1 && day <= 31) {
      const candidate = new Date(today.getFullYear(), today.getMonth(), day);
      if (candidate.getTime() < today.setHours(0, 0, 0, 0)) candidate.setMonth(candidate.getMonth() + 1);
      return toISODate(candidate);
    }
  }
  return null;
}

/** Interpreta '10:30', 'a las 4', '4 pm'. */
function parseTime(text: string): string | null {
  const t = normalize(text);
  const explicit = t.match(/(\d{1,2}):(\d{2})/);
  if (explicit) return `${explicit[1].padStart(2, '0')}:${explicit[2]}`;

  const hour = t.match(/\b(\d{1,2})\s*(am|pm|de la tarde|de la manana|h)?\b/);
  if (hour) {
    let h = Number(hour[1]);
    const suffix = hour[2] ?? '';
    if ((suffix === 'pm' || suffix === 'de la tarde') && h < 12) h += 12;
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
  }
  return null;
}

const isYes = (text: string): boolean => /\b(si|sii|claro|dale|confirma|confirmo|ok|listo|dale que si|dalee|dsp|por supuesto)\b/.test(normalize(text));
const isNo = (text: string): boolean => /\b(no|mejor no|cancela|luego|despues)\b/.test(normalize(text));

let messageId = 0;
const nextId = () => ++messageId;

export function lunaMessage(from: 'bot' | 'user', text: string, extra: Partial<LunaMessage> = {}): LunaMessage {
  return { id: nextId(), from, text, ...extra };
}

/**
 * Sesión conversacional. Guarda el estado del flujo de reserva (servicio →
 * fecha → hora → confirmación) y ejecuta la función correspondiente en cada
 * paso.
 */
export class LunaSession {
  private state: FlowState = { step: 'idle' };
  private user: User | null;
  private cachedServices: Service[] = [];
  private cancelCandidates: Appointment[] = [];

  constructor(user: User | null) {
    this.user = user;
  }

  setUser(user: User | null): void {
    this.user = user;
    if (!user) this.state = { step: 'idle' };
  }

  greeting(): LunaMessage {
    const name = this.user ? this.user.name.split(' ')[0] : '';
    return lunaMessage(
      'bot',
      this.user
        ? `¡Hola, ${name}! Soy Luna, tu asistente de Oasis Spa. Puedo consultar horarios y agendar tu cita directamente. ¿Qué necesitas?`
        : '¡Hola! Soy Luna, la asistente de Oasis Spa. Puedo mostrarte servicios y promociones, y agendar tu cita si inicias sesión. ¿Qué te gustaría?',
      { options: [{ label: 'Quiero reservar', value: 'Quiero reservar' }, { label: 'Ver promociones', value: 'Ver promociones' }, { label: 'Precios', value: 'Precios' }] },
    );
  }

  private async services(): Promise<Service[]> {
    if (this.cachedServices.length === 0) this.cachedServices = await servicesService.list();
    return this.cachedServices;
  }

  private reset(): void {
    this.state = { step: 'idle' };
  }

  /** Procesa un mensaje de la clienta y devuelve las respuestas de Luna. */
  async handle(text: string): Promise<LunaMessage[]> {
    try {
      if (this.state.step !== 'idle' && /^(cancelar|olvidalo|dejalo)$/i.test(text.trim())) {
        this.reset();
        return [lunaMessage('bot', 'Listo, descarté esa solicitud. ¿En qué más puedo ayudarte?')];
      }
      if (this.state.step !== 'idle') return await this.continueFlow(text);
      return await this.startIntent(text);
    } catch (error) {
      this.reset();
      return [lunaMessage('bot', `Ups, algo salió mal: ${errorMessage(error)}`)];
    }
  }

  private async startIntent(text: string): Promise<LunaMessage[]> {
    const intent = detectIntent(text);
    const services = await this.services();

    if (intent === 'reservar') {
      const service = matchService(services, text);
      const date = parseDate(text);
      if (!service) {
        this.state = { step: 'service' };
        return [
          lunaMessage('bot', 'Con gusto. ¿Qué servicio te gustaría reservar?', {
            fnTag: 'listarServicios()',
            options: services.slice(0, 6).map(s => ({ label: `${s.name} · $${s.price}`, value: s.name })),
          }),
        ];
      }
      this.state = { step: 'date', serviceId: service.id };
      if (date) return this.askTime(date);
      return [this.askDate(service)];
    }

    if (intent === 'precios') {
      const list = services.map(s => `${s.name} — $${s.price} (${s.durationMin} min)`).join('\n');
      return [
        lunaMessage('bot', `Estos son nuestros precios:\n${list}\n\n¿Quieres que agende alguno?`, {
          fnTag: 'listarServicios()',
          options: services.slice(0, 4).map(s => ({ label: `Reservar ${s.name}`, value: `Reservar ${s.name}` })),
        }),
      ];
    }

    if (intent === 'promociones') {
      const promotions = await promotionsService.list();
      if (promotions.length === 0) return [lunaMessage('bot', 'Por ahora no tenemos promociones vigentes.', { fnTag: 'listarPromociones()' })];
      const list = promotions
        .map(p => `${p.badge} ${p.title}${p.priceNow != null ? ` — $${p.priceNow}` : ''} (${p.validText})`)
        .join('\n');
      return [
        lunaMessage('bot', `Promociones vigentes:\n${list}\n\n¿Te reservo alguna?`, {
          fnTag: 'listarPromociones()',
          options: promotions.slice(0, 3).map(p => ({ label: p.title, value: `Reservar ${p.title}` })),
        }),
      ];
    }

    if (intent === 'mis-citas') {
      if (!this.user) return [this.needLogin()];
      const upcoming = await appointmentsService.getUpcoming(this.user.id);
      if (upcoming.length === 0) {
        return [
          lunaMessage('bot', 'No tienes citas próximas. ¿Quieres que agende una?', {
            fnTag: 'consultarMisCitas()',
            options: [{ label: 'Sí, reservar', value: 'Quiero reservar' }],
          }),
        ];
      }
      const list = upcoming
        .map(a => `• ${a.serviceName} — ${formatLongDate(a.start)} a las ${toTime(a.start)} con ${a.specialistName}`)
        .join('\n');
      return [lunaMessage('bot', `Tienes ${upcoming.length} cita(s) próxima(s):\n${list}`, { fnTag: 'consultarMisCitas()' })];
    }

    if (intent === 'cancelar') {
      if (!this.user) return [this.needLogin()];
      const upcoming = await appointmentsService.getUpcoming(this.user.id);
      if (upcoming.length === 0) return [lunaMessage('bot', 'No encuentro citas activas para cancelar.', { fnTag: 'consultarMisCitas()' })];
      this.cancelCandidates = upcoming;
      this.state = { step: 'cancel' };
      return [
        lunaMessage('bot', '¿Cuál cita deseas cancelar?', {
          fnTag: 'consultarMisCitas()',
          options: upcoming.map((a, i) => ({ label: `${a.serviceName} · ${weekdayShort(a.start)} ${toTime(a.start)}`, value: String(i + 1) })),
        }),
      ];
    }

    if (intent === 'horarios') {
      return [
        lunaMessage('bot', 'Atendemos de lunes a sábado de 09:00 a 18:00 y los domingos de 10:00 a 14:00. ¿Para qué día quieres reservar?', {
          options: [{ label: 'Hoy', value: 'hoy' }, { label: 'Mañana', value: 'mañana' }, { label: 'El sábado', value: 'el sábado' }],
        }),
      ];
    }

    if (intent === 'especialistas') {
      const specialists = await specialistsService.list();
      const list = specialists.map(s => `${s.name} — ${s.role} (★ ${s.rating})`).join('\n');
      return [lunaMessage('bot', `Nuestro equipo:\n${list}\n\n¿Con quién te gustaría agendar?`, { fnTag: 'listarEspecialistas()' })];
    }

    if (intent === 'saludo') return [this.greeting()];

    return [
      lunaMessage('bot', 'Puedo agendar una cita, consultar tus reservas, revisar precios o promociones. ¿Qué prefieres?', {
        options: [
          { label: 'Reservar una cita', value: 'Quiero reservar' },
          { label: 'Mis citas', value: 'Mis citas' },
          { label: 'Promociones', value: 'Promociones' },
        ],
      }),
    ];
  }

  private async continueFlow(text: string): Promise<LunaMessage[]> {
    const services = await this.services();

    if (this.state.step === 'service') {
      const service = matchService(services, text);
      if (!service) {
        return [
          lunaMessage('bot', 'No identifiqué ese servicio. Elige uno de la lista, por favor.', {
            options: services.map(s => ({ label: s.name, value: s.name })),
          }),
        ];
      }
      this.state = { step: 'date', serviceId: service.id };
      const date = parseDate(text);
      if (date) return this.askTime(date);
      return [this.askDate(service)];
    }

    if (this.state.step === 'date') {
      const date = parseDate(text);
      if (!date) {
        const service = services.find(s => s.id === this.state.serviceId)!;
        return [this.askDate(service, 'No entendí la fecha. ')];
      }
      return this.askTime(date);
    }

    if (this.state.step === 'time') {
      const time = parseTime(text);
      if (!time) return [lunaMessage('bot', 'Dime la hora en formato 24 h, por ejemplo 10:00 o 15:30.')];

      // === Ejecución real: consulta de disponibilidad ===
      const availability = await appointmentsService.getAvailability(this.state.serviceId!, this.state.date!);
      const slot = availability.slots.find(s => s.time === time);
      const service = services.find(s => s.id === this.state.serviceId)!;

      if (!slot || !slot.available) {
        const free = availability.slots.filter(s => s.available).slice(0, 6);
        if (free.length === 0) {
          this.state = { step: 'date', serviceId: this.state.serviceId };
          return [
            lunaMessage('bot', `No queda disponibilidad de ${service.name} ese día. ¿Probamos con otra fecha?`, {
              fnTag: `consultarDisponibilidad("${service.name}", "${this.state.date}")`,
              options: this.dateOptions(),
            }),
          ];
        }
        return [
          lunaMessage('bot', `Las ${time} ya están ocupadas. Te quedan estos horarios ese día:`, {
            fnTag: `consultarDisponibilidad("${service.name}", "${this.state.date}")`,
            options: free.map(s => ({ label: s.time, value: s.time })),
          }),
        ];
      }

      const specialists = await specialistsService.list();
      const specialist = specialists.find(s => s.id === slot.specialistIds[0]);
      this.state = { ...this.state, step: 'confirm', time, specialistId: specialist?.id };

      return [
        lunaMessage(
          'bot',
          `${specialist?.name ?? 'Una especialista'} está disponible. ¿Confirmo tu cita de ${service.name} el ${formatLongDate(`${this.state.date}T12:00:00`)} a las ${time}? Son $${service.price} y dura ${service.durationMin} min.`,
          {
            fnTag: `consultarDisponibilidad("${service.name}", "${this.state.date}") → disponible`,
            options: [{ label: 'Sí, confirmar', value: 'sí' }, { label: 'No', value: 'no' }],
          },
        ),
      ];
    }

    if (this.state.step === 'confirm') {
      if (isNo(text)) {
        this.reset();
        return [lunaMessage('bot', 'Sin problema, no reservé nada. ¿Quieres ver otro horario?')];
      }
      if (!isYes(text)) return [lunaMessage('bot', '¿Confirmo la cita? Respóndeme sí o no, por favor.')];
      if (!this.user) return [this.needLogin()];

      // === Ejecución real: registro de la cita en el sistema ===
      const service = services.find(s => s.id === this.state.serviceId)!;
      // Se guardan fecha y hora antes de limpiar el flujo, para la etiqueta.
      const { date, time } = this.state;
      const appointment = await appointmentsService.create({
        clientId: this.user.id,
        serviceId: this.state.serviceId!,
        date: date!,
        time: time!,
        specialistId: this.state.specialistId,
        notes: 'Reserva agendada por Luna',
      });
      this.reset();

      return [
        lunaMessage(
          'bot',
          `¡Cita confirmada! ${appointment.serviceName} el ${formatLongDate(appointment.start)} a las ${toTime(appointment.start)} con ${appointment.specialistName}. La verás en "Mis Reservas". 🌿`,
          {
            fnTag: `registrarCita("${service.name}", "${date} ${time}") → ${appointment.id}`,
            mutated: true,
          },
        ),
      ];
    }

    if (this.state.step === 'cancel') {
      const index = Number(text.trim()) - 1;
      const target = Number.isInteger(index) && this.cancelCandidates[index]
        ? this.cancelCandidates[index]
        : this.cancelCandidates.find(a => normalize(text).includes(normalize(a.serviceName)));
      if (!target) return [lunaMessage('bot', 'No identifiqué la cita. Dime el número de la lista, por favor.')];

      // === Ejecución real: cancelación ===
      const cancelled = await appointmentsService.cancel(target.id, 'Cancelada desde el chat con Luna');
      this.reset();
      return [
        lunaMessage('bot', `Cancelé tu cita de ${cancelled.serviceName}. Cuando quieras te agendo otra.`, {
          fnTag: `cancelarCita("${cancelled.id}")`,
          mutated: true,
        }),
      ];
    }

    return [lunaMessage('bot', '¿En qué más puedo ayudarte?')];
  }

  private askDate(service: Service, prefix = ''): LunaMessage {
    this.state = { step: 'date', serviceId: service.id };
    return lunaMessage('bot', `${prefix}Perfecto, ${service.name} ($${service.price} · ${service.durationMin} min). ¿Qué día te queda bien?`, {
      options: this.dateOptions(),
    });
  }

  private dateOptions(): LunaOption[] {
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const day = addDays(today, i);
      const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${weekdayShort(day)} ${day.getDate()}`;
      return { label, value: toISODate(day) };
    });
  }

  private async askTime(date: string): Promise<LunaMessage[]> {
    const service = (await this.services()).find(s => s.id === this.state.serviceId)!;

    // === Ejecución real: consulta de disponibilidad del día ===
    const availability = await appointmentsService.getAvailability(service.id, date);
    const free = availability.slots.filter(s => s.available);
    this.state = { ...this.state, step: 'time', date };

    if (free.length === 0) {
      this.state = { step: 'date', serviceId: service.id };
      return [
        lunaMessage('bot', `No hay horarios libres de ${service.name} el ${formatLongDate(`${date}T12:00:00`)}. ¿Probamos otro día?`, {
          fnTag: `consultarDisponibilidad("${service.name}", "${date}") → 0 horarios`,
          options: this.dateOptions(),
        }),
      ];
    }

    return [
      lunaMessage('bot', `Para el ${formatLongDate(`${date}T12:00:00`)} tengo estos horarios disponibles. ¿Cuál prefieres?`, {
        fnTag: `consultarDisponibilidad("${service.name}", "${date}") → ${free.length} horarios`,
        options: free.slice(0, 8).map(s => ({ label: s.time, value: s.time })),
      }),
    ];
  }

  private needLogin(): LunaMessage {
    this.reset();
    return lunaMessage('bot', 'Para agendar o consultar tus citas necesito que inicies sesión. Puedes hacerlo desde el botón "Ingresar" del menú.');
  }
}
