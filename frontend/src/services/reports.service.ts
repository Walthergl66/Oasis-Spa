/**
 * Reportes del administrador. Todos los indicadores se calculan a partir de las
 * citas reales — ninguno está escrito a mano. En NestJS serán consultas SQL
 * agregadas sobre la tabla `appointments`.
 */
import { request } from '../api/http';
import { db } from '../api/localDb';
import type { DashboardReport, Specialist } from '../types';
import { addDays, isSameDay, startOfDay, toISODate } from '../utils/date';

const CATEGORY_COLORS: Record<string, string> = {
  'Uñas': '#C17A54',
  'Facial': '#609C69',
  'Masaje': '#C79A2E',
  'Pestañas': '#9B6B8F',
  'Cabello': '#6B8F9B',
  'Spa': '#8F6B9B',
};

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function pct(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function buildReport(): DashboardReport {
  const data = db();
  const now = new Date();
  const today = startOfDay(now);
  const billable = data.appointments.filter(a => a.status === 'completada' || a.status === 'confirmada');

  // --- Hoy ---
  const todayAppointments = data.appointments.filter(a => isSameDay(a.start, today) && a.status !== 'cancelada');
  const todayRevenue = todayAppointments.reduce((sum, a) => sum + a.price, 0);
  const yesterdayCount = data.appointments.filter(
    a => isSameDay(a.start, addDays(today, -1)) && a.status !== 'cancelada',
  ).length;

  // --- Ocupación: minutos ocupados sobre minutos disponibles del equipo hoy ---
  const workingSpecialists = data.specialists.filter((s: Specialist) => s.active && s.status !== 'Descanso');
  const capacityMinutes = workingSpecialists.length * 9 * 60;
  const bookedMinutes = todayAppointments.reduce((sum, a) => sum + a.durationMin, 0);
  const occupancy = capacityMinutes === 0 ? 0 : Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100));

  // --- Ingresos de los últimos 7 días ---
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, -6 + i);
    const value = billable
      .filter(a => isSameDay(a.start, day))
      .reduce((sum, a) => sum + a.price, 0);
    return { day: DAY_LABELS[day.getDay()], value };
  });

  // --- Mes en curso vs. mes anterior ---
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const inRange = (iso: string, from: Date, to: Date) => {
    const t = new Date(iso).getTime();
    return t >= from.getTime() && t < to.getTime();
  };
  const monthAppointments = billable.filter(a => inRange(a.start, monthStart, addDays(monthStart, 32)));
  const prevMonthAppointments = billable.filter(a => inRange(a.start, prevMonthStart, monthStart));
  const monthRevenue = monthAppointments.reduce((sum, a) => sum + a.price, 0);
  const prevRevenue = prevMonthAppointments.reduce((sum, a) => sum + a.price, 0);
  const revenueDelta = prevRevenue === 0 ? 100 : Math.round(((monthRevenue - prevRevenue) / prevRevenue) * 100);

  const attended = data.appointments.filter(a => a.status === 'completada').length;
  const newClients = data.users.filter(
    u => u.role === 'cliente' && inRange(`${u.memberSince}T12:00:00`, monthStart, addDays(monthStart, 32)),
  ).length;
  const cancelledMonth = data.appointments.filter(
    a => a.status === 'cancelada' && inRange(a.start, monthStart, addDays(monthStart, 32)),
  ).length;
  const cancelRate = monthAppointments.length + cancelledMonth === 0
    ? 0
    : Math.round((cancelledMonth / (monthAppointments.length + cancelledMonth)) * 1000) / 10;

  // --- Servicios más solicitados ---
  const counts = new Map<string, number>();
  data.appointments
    .filter(a => a.status !== 'cancelada')
    .forEach(a => counts.set(a.serviceName, (counts.get(a.serviceName) ?? 0) + 1));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = ranked[0]?.[1] ?? 1;
  const topServices = ranked.map(([name, count]) => ({ name, count, pct: Math.round((count / maxCount) * 100) }));

  // --- Distribución por categoría ---
  const categoryCounts = new Map<string, number>();
  data.appointments
    .filter(a => a.status !== 'cancelada')
    .forEach(a => {
      const service = data.services.find(s => s.id === a.serviceId);
      if (!service) return;
      categoryCounts.set(service.category, (categoryCounts.get(service.category) ?? 0) + 1);
    });
  const totalCategorized = [...categoryCounts.values()].reduce((sum, v) => sum + v, 0);
  const byCategory = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      pct: pct(count, totalCategorized),
      color: CATEGORY_COLORS[category] ?? '#A98872',
    }));

  const cancellationsThisWeek = data.appointments.filter(
    a => a.status === 'cancelada' && new Date(a.start).getTime() >= addDays(today, -7).getTime(),
  ).length;

  return {
    kpis: [
      { label: 'Ingresos del mes', value: `$${monthRevenue.toLocaleString('es-EC')}`, delta: `${revenueDelta >= 0 ? '+' : ''}${revenueDelta}% vs mes anterior`, positive: revenueDelta >= 0 },
      { label: 'Citas atendidas', value: String(attended), delta: `${monthAppointments.length} este mes`, positive: true },
      { label: 'Nuevas clientas', value: String(newClients), delta: 'registradas este mes', positive: true },
      { label: 'Tasa de cancelación', value: `${cancelRate}%`, delta: `${cancelledMonth} canceladas`, positive: cancelRate < 10 },
    ],
    revenueByDay,
    topServices,
    byCategory,
    todayCount: todayAppointments.length,
    todayRevenue,
    occupancy,
    cancellations: cancellationsThisWeek,
    todayDelta: todayAppointments.length - yesterdayCount,
  };
}

export const reportsService = {
  /** GET /reports/dashboard */
  getDashboard: (): Promise<DashboardReport> =>
    request({ method: 'get', path: '/reports/dashboard', mock: () => buildReport() }),

  /** GET /reports/specialists — carga de trabajo del día por especialista. */
  getSpecialistLoad: (date = toISODate(new Date())): Promise<{ specialist: Specialist; count: number }[]> =>
    request({
      method: 'get',
      path: '/reports/specialists',
      params: { date },
      mock: () => {
        const data = db();
        return data.specialists
          .filter(s => s.active)
          .map(specialist => ({
            specialist,
            count: data.appointments.filter(
              a => a.specialistId === specialist.id && a.status !== 'cancelada' && isSameDay(a.start, new Date(`${date}T12:00:00`)),
            ).length,
          }));
      },
    }),
};
