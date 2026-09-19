/** Zona horaria del spa: UTC-5 (America/Guayaquil) sin horario de verano. */
const SPA_OFFSET_MS = 5 * 60 * 60 * 1000;

export type ToolIntent =
  | 'list_services'
  | 'check_availability'
  | 'book'
  | 'reschedule'
  | 'cancel'
  | 'my_appointments';

export interface NamedService {
  id: string;
  name: string;
}

/** Minúsculas sin tildes para comparar intenciones en español. */
export function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function detectConfirmation(text: string): boolean {
  const t = ` ${normalize(text)} `;
  return /(^|[\s,.\u00a1!¿?])(si|confirmo|confirmar|confirmado|confirmada|de acuerdo|adelante|hazlo|procede|dale|ok|vale)[\s,.\u00a1!¿?]|^si\b/.test(
    t,
  );
}

export function detectDenial(text: string): boolean {
  const t = normalize(text);
  return /\b(no|mejor no|olv[ií]dalo|descarta|anula la propuesta)\b/.test(t);
}

export function detectToolIntent(text: string): ToolIntent | null {
  const t = normalize(text);
  if (/\bcancel/.test(t)) return 'cancel';
  if (/\breprogram|\breagend|\bmodific|\bcambiar\b.*\bcita|\bmover\b.*\bcita/.test(t)) {
    return 'reschedule';
  }
  if (/\breserv|\bagend|\bapart|\bquiero\b.*\bcita|\bnecesito\b.*\bcita|\bpedir\b.*\bcita|\bsacar\b.*\bcita/.test(t)) {
    return 'book';
  }
  if (/\bmis citas\b|\bmi cita\b|\bmis reservas\b|\bque citas tengo\b/.test(t)) {
    return 'my_appointments';
  }
  if (/\bdisponib|\bhorario|\bhueco|\bespacio|\bcupo|\bturno|\batienden/.test(t)) {
    return 'check_availability';
  }
  if (/\bservicio|\btratamiento|\bcatalogo|\bmasaje|\bfacial|\bcorporal|\bprecio|\bcuanto|\bcosto/.test(t)) {
    return 'list_services';
  }
  return null;
}

function ecuadorParts(now: Date): { y: number; m: number; d: number } {
  const local = new Date(now.getTime() - SPA_OFFSET_MS);
  return {
    y: local.getUTCFullYear(),
    m: local.getUTCMonth(),
    d: local.getUTCDate(),
  };
}

function toYmd(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m, d));
  return dt.toISOString().slice(0, 10);
}

/**
 * Extrae TODAS las fechas calendario del mensaje, en orden de aparición.
 * Base de extractDate; permite distinguir fecha actual vs. nueva
 * en reprogramaciones ("mueve mi cita de mañana al viernes").
 */
export function extractAllDates(text: string, now: Date = new Date()): string[] {
  const t = ` ${normalize(text)} `;
  const { y, m, d } = ecuadorParts(now);
  const found: Array<{ index: number; value: string }> = [];

  const push = (re: RegExp, value: string) => {
    const match = re.exec(t);
    if (match && match.index !== undefined) found.push({ index: match.index, value });
  };

  push(/\bpasado manana\b/, toYmd(y, m, d + 2));
  push(/(?<!pasado )manana\b/, toYmd(y, m, d + 1));
  push(/\bhoy\b/, toYmd(y, m, d));

  const isoRe = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;
  let isoMatch: RegExpExecArray | null;
  while ((isoMatch = isoRe.exec(t)) !== null) {
    found.push({ index: isoMatch.index, value: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` });
  }

  const latinRe = /\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}))?\b/g;
  let latinMatch: RegExpExecArray | null;
  while ((latinMatch = latinRe.exec(t)) !== null) {
    const yyyy = latinMatch[3] ? Number(latinMatch[3]) : y;
    found.push({
      index: latinMatch.index,
      value: toYmd(yyyy, Number(latinMatch[2]) - 1, Number(latinMatch[1])),
    });
  }

  const weekdays: Array<[RegExp, number]> = [
    [/\bdomingo\b/, 0],
    [/\blunes\b/, 1],
    [/\bmartes\b/, 2],
    [/\bmiercoles\b/, 3],
    [/\bjueves\b/, 4],
    [/\bviernes\b/, 5],
    [/\bsabado\b/, 6],
  ];
  const todayDow = new Date(Date.UTC(y, m, d)).getUTCDay();
  for (const [re, dow] of weekdays) {
    const match = re.exec(t);
    if (match && match.index !== undefined) {
      let delta = (dow - todayDow + 7) % 7;
      if (delta === 0) delta = 7;
      found.push({ index: match.index, value: toYmd(y, m, d + delta) });
    }
  }

  return found.sort((a, b) => a.index - b.index).map((f) => f.value);
}

/**
 * Extrae fecha calendario YYYY-MM-DD del mensaje (hoy, mañana,
 * pasado mañana, ISO, DD/MM[/YYYY] o próximo día de semana).
 */
export function extractDate(text: string, now: Date = new Date()): string | null {
  return extractAllDates(text, now)[0] ?? null;
}

/** Extrae hora HH:mm (24h) o null si es ambigua/ausente. */
export function extractTime(text: string): string | null {
  const t = normalize(text);

  const hm = t.match(/\b([01]?\d|2[0-3])[:h]([0-5]\d)\b/);
  if (hm) {
    let h = Number(hm[1]);
    const min = hm[2];
    const ampm = t.match(/\b(am|pm|a\.m\.|p\.m\.)\b/);
    if (ampm && /pm/.test(ampm[1]) && h < 12) h += 12;
    if (ampm && /am/.test(ampm[1]) && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  }

  const plain = t.match(/\b(?:a las|las)\s+(\d{1,2})(?:\s*(am|pm|de la manana|de la tarde|de la noche))?\b/);
  if (plain) {
    let h = Number(plain[1]);
    const mod = plain[2] || '';
    if (/pm|tarde|noche/.test(mod) && h < 12) h += 12;
    if (h > 23) return null;
    return `${String(h).padStart(2, '0')}:00`;
  }
  return null;
}

/** Mejor coincidencia de servicio por nombre mencionado (match más largo gana). */
export function resolveService(
  services: NamedService[],
  text: string,
): NamedService | null {
  const t = normalize(text);
  let best: NamedService | null = null;
  for (const s of services) {
    const name = normalize(s.name);
    if (name && t.includes(name) && (!best || name.length > normalize(best.name).length)) {
      best = s;
    }
  }
  if (best) return best;
  const keywords = t.split(/[^a-z]+/).filter((w) => w.length > 4);
  for (const s of services) {
    const nameWords = normalize(s.name).split(/[^a-z]+/);
    if (keywords.some((k) => nameWords.includes(k))) return s;
  }
  return null;
}
