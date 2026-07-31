/** Utilidades de fecha/hora en español (es-EC), sin dependencias externas. */

const LOCALE = 'es-EC';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Date -> 'YYYY-MM-DD' (en hora local, no UTC). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 'YYYY-MM-DD' + 'HH:mm' -> Date local. */
export function parseDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/** Date -> 'HH:mm'. */
export function toTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return toISODate(da) === toISODate(db);
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** 'Miércoles, 22 de julio de 2026' */
export function formatLongDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return capitalize(
    d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  );
}

/** '22 jul 2026' */
export function formatShortDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** 'LUN' / 'MIÉ' */
export function weekdayShort(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '').slice(0, 3).toUpperCase();
}

/** 'julio 2026' */
export function monthYear(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return capitalize(d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }));
}

/** 'Hace 2 h' / 'Hace 3 días' / 'Ahora mismo' */
export function timeAgo(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Ahora mismo';
  if (min < 60) return `Hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
}

/** Diferencia en días naturales respecto a hoy (positivo = futuro). */
export function daysFromToday(value: Date | string): number {
  const d = startOfDay(typeof value === 'string' ? new Date(value) : value);
  const today = startOfDay(new Date());
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}
