/**
 * Tipos de dominio del sistema.
 *
 * Son el contrato entre el frontend y el backend: cada interfaz de aquí
 * corresponde a una entidad que existirá en NestJS + PostgreSQL. Por eso los
 * ids son `string` (UUID en la base) y las fechas viajan en ISO 8601.
 */

export type Role = 'cliente' | 'especialista' | 'admin';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export type SpecialistStatus = 'Disponible' | 'En cita' | 'Descanso';

export type LoyaltyLevel = 'Bronce' | 'Ámbar' | 'Oro';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: Role;
  /** Iniciales derivadas del nombre; se calculan al crear el usuario. */
  initials: string;
  /** ISO date (YYYY-MM-DD) */
  memberSince: string;
  points: number;
  level: LoyaltyLevel;
  favoriteServices: string[];
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMin: number;
  price: number;
  image: string;
  popular: boolean;
  rating: number;
  reviewsCount: number;
  active: boolean;
}

export interface Specialist {
  id: string;
  name: string;
  role: string;
  initials: string;
  rating: number;
  status: SpecialistStatus;
  /** Categorías de servicio que puede atender. */
  categories: string[];
  active: boolean;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  specialistId: string;
  specialistName: string;
  /** Fecha y hora de inicio en ISO 8601. */
  start: string;
  durationMin: number;
  price: number;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  reviewed: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  color: 'terracota' | 'rosa' | 'verde' | 'dorado';
  validText: string;
  serviceIds: string[];
  priceBefore: number | null;
  priceNow: number | null;
  image: string;
  active: boolean;
}

export interface Review {
  id: string;
  appointmentId: string | null;
  clientId: string;
  clientName: string;
  initials: string;
  serviceId: string;
  serviceName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  icon: string;
  title: string;
  text: string;
  createdAt: string;
  read: boolean;
}

/** Un horario concreto devuelto por la consulta de disponibilidad. */
export interface AvailabilitySlot {
  time: string;
  available: boolean;
  specialistIds: string[];
}

export interface Availability {
  /** YYYY-MM-DD */
  date: string;
  serviceId: string;
  slots: AvailabilitySlot[];
}

export interface CreateAppointmentInput {
  clientId: string;
  serviceId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  specialistId?: string;
  notes?: string;
}

/** Filtros aceptados al listar citas (equivalen a los query params de NestJS). */
export interface DbAppointmentFilter {
  status?: AppointmentStatus;
  /** YYYY-MM-DD */
  date?: string;
  specialistId?: string;
  clientId?: string;
}

export interface ClientSummary {
  client: User;
  visits: number;
  spent: number;
  lastVisit: string | null;
  status: 'Nueva' | 'Activa' | 'Inactiva';
}

export interface DashboardReport {
  kpis: { label: string; value: string; delta: string; positive: boolean }[];
  revenueByDay: { day: string; value: number }[];
  topServices: { name: string; count: number; pct: number }[];
  byCategory: { category: string; pct: number; color: string }[];
  todayCount: number;
  todayDelta: number;
  todayRevenue: number;
  occupancy: number;
  cancellations: number;
}
