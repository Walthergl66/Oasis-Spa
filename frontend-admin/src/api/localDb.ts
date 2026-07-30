/**
 * Repositorio local persistente.
 *
 * Hace de "base de datos" mientras el backend NestJS no existe: guarda todo en
 * localStorage, así las citas creadas, canceladas o editadas siguen ahí al
 * recargar. Sólo lo consumen los archivos de `src/services/`; ninguna vista lo
 * importa. Cuando el backend esté listo se apaga con VITE_USE_MOCK=false y esta
 * pieza deja de usarse sin tocar componentes.
 */
import type { Appointment, AppNotification, Promotion, Review, Service, Specialist, User } from '../types';
import {
  SEED_CREDENTIALS, SEED_PROMOTIONS, SEED_SERVICES, SEED_SPECIALISTS, SEED_USERS,
  buildSeedAppointments, buildSeedNotifications, buildSeedReviews,
} from '../mocks/seed';

const STORAGE_KEY = 'oasis-spa-db';
const VERSION = 1;

export interface DbShape {
  version: number;
  users: User[];
  credentials: Record<string, string>;
  services: Service[];
  specialists: Specialist[];
  appointments: Appointment[];
  promotions: Promotion[];
  reviews: Review[];
  notifications: AppNotification[];
}

function buildSeed(): DbShape {
  return {
    version: VERSION,
    users: structuredClone(SEED_USERS),
    credentials: { ...SEED_CREDENTIALS },
    services: structuredClone(SEED_SERVICES),
    specialists: structuredClone(SEED_SPECIALISTS),
    appointments: buildSeedAppointments(),
    promotions: structuredClone(SEED_PROMOTIONS),
    reviews: buildSeedReviews(),
    notifications: buildSeedNotifications(),
  };
}

let cache: DbShape | null = null;

function load(): DbShape {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DbShape;
      if (parsed.version === VERSION) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    // localStorage corrupto o no disponible: se recrea desde la semilla.
  }
  cache = buildSeed();
  persist();
  return cache;
}

function persist(): void {
  if (!cache) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Modo privado / cuota llena: la sesión sigue funcionando en memoria.
  }
}

/** Lee el estado actual (sólo lectura para quien lo consume). */
export function db(): DbShape {
  return load();
}

/** Aplica una mutación sobre la base y la persiste. */
export function mutate<T>(fn: (data: DbShape) => T): T {
  const data = load();
  const result = fn(data);
  persist();
  return result;
}

/** Reinicia la base a los datos semilla (útil para demos de la tesis). */
export function resetDb(): void {
  cache = buildSeed();
  persist();
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

/** Copia profunda para que las vistas nunca muten la base por referencia. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}
