/**
 * Datos semilla del sistema.
 *
 * Equivale a lo que en producción entregarán las tablas de PostgreSQL: es el
 * ÚNICO lugar con datos inventados. Las vistas nunca lo importan — sólo el
 * repositorio local (`api/localDb.ts`) lo usa para poblar la base la primera
 * vez. Al conectar el backend, este archivo se convierte en el seed de NestJS.
 */
import type {
  Appointment, AppNotification, Promotion, Review, Service, Specialist, User,
} from '../types';
import { addDays, toISODate, parseDateTime } from '../utils/date';

export const initials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');

export const SEED_SERVICES: Service[] = [
  {
    id: 'svc-1', name: 'Manicura Glossy', category: 'Uñas', price: 28, durationMin: 60,
    description: 'Acabado glossy de larga duración con base nutritiva y detalles a elección. Incluye limado y cutícula.',
    popular: true, image: '/img/manicura.jpg', rating: 4.9, reviewsCount: 128, active: true,
  },
  {
    id: 'svc-2', name: 'Masaje Relajante', category: 'Masaje', price: 55, durationMin: 90,
    description: 'Masaje de cuerpo completo con aceites esenciales de lavanda y jojoba. Alivio de tensiones musculares.',
    popular: true, image: '/img/masaje.jpg', rating: 4.8, reviewsCount: 96, active: true,
  },
  {
    id: 'svc-3', name: 'Diseño de Pestañas', category: 'Pestañas', price: 65, durationMin: 120,
    description: 'Extensión de pestañas pelo a pelo con fibra de seda. Efecto natural o volumen según preferencia.',
    popular: false, image: '/img/pestanas.jpg', rating: 4.7, reviewsCount: 74, active: true,
  },
  {
    id: 'svc-4', name: 'Tratamiento Capilar', category: 'Cabello', price: 45, durationMin: 75,
    description: 'Hidratación profunda con keratina vegetal, sellado de puntas y brillo intenso.',
    popular: false, image: '/img/cabello.jpg', rating: 4.6, reviewsCount: 61, active: true,
  },
  {
    id: 'svc-5', name: 'Facial Express', category: 'Facial', price: 38, durationMin: 55,
    description: 'Limpieza profunda, exfoliación suave e hidratación intensiva. Piel luminosa en menos de una hora.',
    popular: true, image: '/img/facial.jpg', rating: 4.9, reviewsCount: 112, active: true,
  },
  {
    id: 'svc-6', name: 'Ritual Spa Completo', category: 'Spa', price: 93, durationMin: 180,
    description: 'Experiencia integral: envoltura corporal y facial hidratante. El lujo de un día completo.',
    popular: false, image: '/img/spa.jpg', rating: 5.0, reviewsCount: 43, active: true,
  },
];

export const SEED_SPECIALISTS: Specialist[] = [
  { id: 'spe-1', name: 'Tatiana Aguirre', role: 'Nail art & manicura', initials: 'TA', rating: 4.9, status: 'Disponible', categories: ['Uñas', 'Pestañas'], active: true },
  { id: 'spe-2', name: 'Valeria Mora', role: 'Uñas & pestañas', initials: 'VM', rating: 4.7, status: 'Disponible', categories: ['Uñas', 'Pestañas', 'Facial'], active: true },
  { id: 'spe-3', name: 'Gabriela Wilson', role: 'Masajes & spa', initials: 'GW', rating: 4.8, status: 'En cita', categories: ['Masaje', 'Spa'], active: true },
  { id: 'spe-4', name: 'Daniela Cedeño', role: 'Facial & cuidado de piel', initials: 'DC', rating: 4.8, status: 'Disponible', categories: ['Facial', 'Spa'], active: true },
  { id: 'spe-5', name: 'Karla Bravo', role: 'Estilismo & cabello', initials: 'KB', rating: 4.6, status: 'Descanso', categories: ['Cabello'], active: true },
];

/** Contraseñas de demo: se guardan aparte del usuario, igual que hará el backend. */
export const SEED_CREDENTIALS: Record<string, string> = {
  'adriana.torres@email.com': 'demo1234',
  'admin@oasisspa.ec': 'admin1234',
};

export const SEED_USERS: User[] = [
  { id: 'usr-1', name: 'Adriana Torres', email: 'adriana.torres@email.com', phone: '099 812 4471', city: 'Manta, Manabí', role: 'cliente', initials: 'AT', memberSince: '2025-03-12', points: 340, level: 'Ámbar', favoriteServices: ['Manicura Glossy', 'Diseño de Pestañas'], active: true },
  { id: 'usr-2', name: 'Camila Ríos', email: 'camila.rios@email.com', phone: '098 334 1290', city: 'Manta, Manabí', role: 'cliente', initials: 'CR', memberSince: '2025-06-02', points: 210, level: 'Bronce', favoriteServices: ['Facial Express'], active: true },
  { id: 'usr-3', name: 'Sofía Cedeño', email: 'sofia.cedeno@email.com', phone: '096 771 5583', city: 'Manta, Manabí', role: 'cliente', initials: 'SC', memberSince: '2024-11-20', points: 620, level: 'Oro', favoriteServices: ['Ritual Spa Completo'], active: true },
  { id: 'usr-4', name: 'María Zambrano', email: 'maria.zambrano@email.com', phone: '099 205 6612', city: 'Manta, Manabí', role: 'cliente', initials: 'MZ', memberSince: '2025-09-08', points: 130, level: 'Bronce', favoriteServices: [], active: true },
  { id: 'usr-5', name: 'Valentina Ponce', email: 'valentina.ponce@email.com', phone: '097 448 9021', city: 'Manta, Manabí', role: 'cliente', initials: 'VP', memberSince: '2026-05-30', points: 40, level: 'Bronce', favoriteServices: [], active: true },
  { id: 'usr-6', name: 'Isabel Loor', email: 'isabel.loor@email.com', phone: '098 917 3345', city: 'Manta, Manabí', role: 'cliente', initials: 'IL', memberSince: '2024-08-14', points: 540, level: 'Oro', favoriteServices: ['Manicura Glossy'], active: true },
  { id: 'usr-7', name: 'Paola Mendoza', email: 'paola.mendoza@email.com', phone: '096 620 7788', city: 'Manta, Manabí', role: 'cliente', initials: 'PM', memberSince: '2026-01-19', points: 20, level: 'Bronce', favoriteServices: [], active: true },
  { id: 'usr-admin', name: 'Administración Spa', email: 'admin@oasisspa.ec', phone: '052 620 118', city: 'Manta, Manabí', role: 'admin', initials: 'SB', memberSince: '2024-01-01', points: 0, level: 'Bronce', favoriteServices: [], active: true },
];

export const SEED_PROMOTIONS: Promotion[] = [
  { id: 'pro-1', title: 'Combo Relax Total', description: 'Masaje Relajante + Facial Express con 30% de descuento. Tu momento de calma completa.', badge: '-30%', color: 'terracota', validText: 'Hasta fin de mes', serviceIds: ['svc-2', 'svc-5'], priceBefore: 93, priceNow: 65, image: '/img/masaje.jpg', active: true },
  { id: 'pro-2', title: 'Martes de Uñas', description: 'Todas las manicuras a mitad de precio los días martes. Reserva con anticipación.', badge: '-50%', color: 'rosa', validText: 'Todos los martes', serviceIds: ['svc-1'], priceBefore: 28, priceNow: 14, image: '/img/manicura.jpg', active: true },
  { id: 'pro-3', title: 'Primera Visita', description: 'Bienvenida especial: 20% de descuento en tu primer servicio con nosotras.', badge: '-20%', color: 'verde', validText: 'Clientes nuevas', serviceIds: ['svc-5'], priceBefore: null, priceNow: null, image: '/img/facial.jpg', active: true },
  { id: 'pro-4', title: 'Día de Spa para Dos', description: 'Trae a una amiga y disfruten el Ritual Spa Completo con precio especial de pareja.', badge: '2x1', color: 'dorado', validText: 'Hasta agotar cupos', serviceIds: ['svc-6'], priceBefore: 186, priceNow: 140, image: '/img/spa.jpg', active: true },
];

/**
 * Las citas se generan relativas a HOY para que la agenda, el dashboard y los
 * reportes siempre tengan datos vivos, sin fechas quemadas.
 */
export function buildSeedAppointments(): Appointment[] {
  const svc = (id: string) => SEED_SERVICES.find(s => s.id === id)!;
  const spe = (id: string) => SEED_SPECIALISTS.find(s => s.id === id)!;
  const usr = (id: string) => SEED_USERS.find(u => u.id === id)!;
  const today = new Date();
  let n = 0;

  const make = (
    offsetDays: number, time: string, clientId: string, serviceId: string,
    specialistId: string, status: Appointment['status'], reviewed = false,
  ): Appointment => {
    const service = svc(serviceId);
    const start = parseDateTime(toISODate(addDays(today, offsetDays)), time);
    return {
      id: `apt-${++n}`,
      clientId, clientName: usr(clientId).name,
      serviceId, serviceName: service.name,
      specialistId, specialistName: spe(specialistId).name,
      start: start.toISOString(),
      durationMin: service.durationMin,
      price: service.price,
      status, notes: '',
      createdAt: addDays(start, -5).toISOString(),
      reviewed,
    };
  };

  return [
    // Hoy — alimenta la agenda y el dashboard del administrador
    make(0, '09:00', 'usr-1', 'svc-1', 'spe-1', 'confirmada'),
    make(0, '10:00', 'usr-6', 'svc-5', 'spe-4', 'confirmada'),
    make(0, '10:30', 'usr-7', 'svc-1', 'spe-2', 'pendiente'),
    make(0, '11:00', 'usr-3', 'svc-2', 'spe-3', 'confirmada'),
    make(0, '15:00', 'usr-4', 'svc-4', 'spe-5', 'confirmada'),
    make(0, '16:00', 'usr-5', 'svc-6', 'spe-3', 'pendiente'),
    // Próximos días — reservas activas de la clienta demo
    make(2, '14:30', 'usr-1', 'svc-1', 'spe-1', 'confirmada'),
    make(5, '12:00', 'usr-1', 'svc-2', 'spe-3', 'confirmada'),
    make(1, '09:30', 'usr-2', 'svc-5', 'spe-4', 'confirmada'),
    make(3, '11:00', 'usr-3', 'svc-3', 'spe-2', 'pendiente'),
    // Historial
    make(-29, '11:00', 'usr-1', 'svc-5', 'spe-4', 'completada', true),
    make(-43, '16:00', 'usr-1', 'svc-4', 'spe-5', 'completada', true),
    make(-58, '10:00', 'usr-1', 'svc-3', 'spe-2', 'completada', false),
    make(-76, '13:00', 'usr-1', 'svc-6', 'spe-3', 'cancelada'),
    make(-12, '10:00', 'usr-3', 'svc-6', 'spe-3', 'completada', true),
    make(-8, '15:00', 'usr-2', 'svc-5', 'spe-4', 'completada', true),
    make(-6, '09:00', 'usr-6', 'svc-1', 'spe-1', 'completada', true),
    make(-20, '11:00', 'usr-4', 'svc-2', 'spe-3', 'completada', true),
    make(-4, '14:00', 'usr-5', 'svc-1', 'spe-2', 'completada', false),
    make(-2, '16:00', 'usr-6', 'svc-2', 'spe-3', 'cancelada'),
  ];
}

export function buildSeedReviews(): Review[] {
  const now = new Date();
  return [
    { id: 'rev-1', appointmentId: null, clientId: 'usr-3', clientName: 'Sofía Cedeño', initials: 'SC', serviceId: 'svc-6', serviceName: 'Ritual Spa Completo', rating: 5, createdAt: addDays(now, -3).toISOString(), text: 'Una experiencia increíble de principio a fin. El ambiente, la atención de Gabriela y el resultado… salí como nueva. Volveré sin duda.' },
    { id: 'rev-2', appointmentId: null, clientId: 'usr-2', clientName: 'Camila Ríos', initials: 'CR', serviceId: 'svc-5', serviceName: 'Facial Express', rating: 5, createdAt: addDays(now, -8).toISOString(), text: 'Mi piel quedó luminosa y súper hidratada. Daniela explicó cada paso y me recomendó una rutina en casa. Muy profesional.' },
    { id: 'rev-3', appointmentId: null, clientId: 'usr-6', clientName: 'Isabel Loor', initials: 'IL', serviceId: 'svc-1', serviceName: 'Manicura Glossy', rating: 4, createdAt: addDays(now, -15).toISOString(), text: 'El acabado glossy dura muchísimo y el diseño quedó precioso. Solo esperé unos minutos de más, pero valió la pena.' },
    { id: 'rev-4', appointmentId: null, clientId: 'usr-4', clientName: 'María Zambrano', initials: 'MZ', serviceId: 'svc-2', serviceName: 'Masaje Relajante', rating: 5, createdAt: addDays(now, -21).toISOString(), text: 'Justo lo que necesitaba después de una semana pesada. La presión perfecta y los aceites de lavanda son un sueño.' },
  ];
}

export function buildSeedNotifications(): AppNotification[] {
  const now = new Date();
  const mins = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
  return [
    { id: 'ntf-1', userId: 'usr-1', icon: '📅', title: 'Recordatorio de cita', text: 'Tienes una cita de Manicura Glossy próximamente.', createdAt: mins(120), read: false },
    { id: 'ntf-2', userId: 'usr-1', icon: '🎁', title: 'Nueva promoción', text: 'Combo Relax Total con 30% de descuento hasta fin de mes.', createdAt: mins(60 * 24), read: false },
    { id: 'ntf-3', userId: 'usr-1', icon: '⭐', title: '¡Ganaste puntos!', text: 'Sumaste 40 puntos por tu última visita.', createdAt: mins(60 * 72), read: true },
    { id: 'ntf-4', userId: 'usr-1', icon: '✓', title: 'Reserva confirmada', text: 'Tu Masaje Relajante quedó confirmado.', createdAt: mins(60 * 96), read: true },
  ];
}
