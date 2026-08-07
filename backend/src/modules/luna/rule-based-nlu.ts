import { Injectable } from '@nestjs/common';
import {
  LunaIntentType,
  LunaNlu,
  LunaNluResult,
  ServiceLike,
} from './luna.types';

/**
 * Comprensión de mensajes por reglas.
 *
 * Implementa el mismo vocabulario que usaba la simulación del frontend:
 * detección de intención por palabras clave y extracción de servicio, fecha y
 * hora. Es determinista y no depende de la red, lo que la hace ideal para la
 * defensa; una implementación con LLM real devolvería el mismo
 * `LunaNluResult` y el flujo de negocio no cambiaría.
 */

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
];

const SPA_OFFSET_MIN = -5 * 60; // America/Guayaquil, sin horario de verano.

/** Minúsculas y sin tildes, para comparar lo que escribe la clienta. */
const normalize = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** "Hoy" en el calendario del spa, como Date con componentes locales. */
function hoyEnSpa(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utc + SPA_OFFSET_MIN * 60_000);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function detectIntent(text: string): LunaIntentType {
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

function matchServiceName(
  services: ServiceLike[],
  text: string,
): string | undefined {
  const t = normalize(text);
  const match =
    services.find((s) => t.includes(normalize(s.name))) ??
    services.find((s) =>
      normalize(s.name)
        .split(' ')
        .some((word) => word.length > 4 && t.includes(word)),
    ) ??
    services.find((s) => t.includes(normalize(s.category)));
  return match?.name;
}

/** Interpreta 'hoy', 'mañana', 'el sábado', '25 de julio', '25/07' o '25'. */
function parseDate(text: string): string | null {
  const t = normalize(text);
  const today = hoyEnSpa();

  if (/\bhoy\b/.test(t)) return toISODate(today);
  if (/pasado ?manana/.test(t)) return toISODate(addDays(today, 2));
  if (/\bmanana\b/.test(t)) return toISODate(addDays(today, 1));

  const weekdayIndex = WEEKDAYS.findIndex((d) => t.includes(normalize(d)));
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
    const month = MONTHS.findIndex((m) => normalize(m) === dayMonth[2]);
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
      const hoyInicio = new Date(today);
      hoyInicio.setHours(0, 0, 0, 0);
      if (candidate.getTime() < hoyInicio.getTime()) {
        candidate.setMonth(candidate.getMonth() + 1);
      }
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

@Injectable()
export class RuleBasedNlu implements LunaNlu {
  parse(message: string, context: { services: ServiceLike[] }): LunaNluResult {
    const text = message.trim();
    const result: LunaNluResult = { intent: detectIntent(text) };

    if (result.intent === 'reservar' || result.intent === 'precios') {
      result.serviceName = matchServiceName(context.services, text);
    }
    if (result.intent === 'reservar') {
      result.date = parseDate(text) ?? undefined;
      result.time = parseTime(text) ?? undefined;
    }
    if (result.intent === 'cancelar') {
      const numero = text.trim().match(/^\d{1,2}$/);
      if (numero) result.index = Number(numero[0]) - 1;
      result.serviceName = matchServiceName(context.services, text);
    }
    return result;
  }
}
