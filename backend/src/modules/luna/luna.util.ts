/**
 * Utilidades del asistente: normalización de texto, fechas en la zona del spa
 * y helpers de formato en español. Son las mismas que usaba la simulación del
 * frontend, replicadas en el backend para que las respuestas no dependan de la
 * zona horaria del servidor.
 */

const ZONA_SPA = 'America/Guayaquil';
const SPA_OFFSET_MIN = -5 * 60; // Ecuador continental, sin horario de verano.

/** Minúsculas y sin tildes, para comparar lo que escribe la clienta. */
export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** "Hoy" en el calendario del spa, como Date con componentes locales. */
export function hoyEnSpa(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utc + SPA_OFFSET_MIN * 60_000);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-EC', { timeZone: ZONA_SPA, ...opts });

/** Instante ISO o fecha 'YYYY-MM-DD' (se asume mediodía del spa) → 'HH:mm'. */
export function toTime(isoOrDate: string): string {
  return fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(isoOrDate),
  );
}

/** 'Miércoles, 22 de julio de 2026' */
export function formatLongDate(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  const s = fmt({
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 'LUN' / 'MIÉ' a partir de un instante ISO. */
export function weekdayShort(iso: string): string {
  return fmt({ weekday: 'short' })
    .format(new Date(iso))
    .replace('.', '')
    .slice(0, 3)
    .toUpperCase();
}

/** Día del spa a 'YYYY-MM-DD' con mediodía, para evitar desfases al formatear. */
export function spaNoon(date: string): string {
  return `${date}T12:00:00-05:00`;
}

export const isYes = (text: string): boolean =>
  /\b(si|sii|claro|dale|confirma|confirmo|ok|listo|dale que si|dalee|dsp|por supuesto)\b/.test(
    normalize(text),
  );

export const isNo = (text: string): boolean =>
  /\b(no|mejor no|cancela|luego|despues)\b/.test(normalize(text));
