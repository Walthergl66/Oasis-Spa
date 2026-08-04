import { Injectable } from '@nestjs/common';
import { AppointmentsStatsService } from '../appointments/appointments-stats.service';
import { SpecialistsService } from '../specialists/specialists.service';
import { UsersService } from '../users/users.service';

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

export interface DashboardReport {
  kpis: Kpi[];
  revenueByDay: { day: string; value: number }[];
  topServices: { name: string; count: number; pct: number }[];
  byCategory: { category: string; pct: number; color: string }[];
  todayCount: number;
  todayDelta: number;
  todayRevenue: number;
  occupancy: number;
  cancellations: number;
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Jornada de trabajo de una especialista, en minutos (09:00–18:00). */
const JORNADA_MIN = 9 * 60;

/**
 * Indicadores del panel administrativo.
 *
 * Este servicio no consulta ninguna tabla: pide los agregados a los módulos
 * que las poseen y se limita a componer, calcular porcentajes y dar formato.
 * Así, si mañana cambia cómo se almacena una cita, aquí no hay nada que tocar.
 *
 * **Ningún número está escrito a mano**: todos salen de la agenda real, que es
 * justo lo que exige el objetivo de "generar información operativa útil para la
 * toma de decisiones".
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly stats: AppointmentsStatsService,
    private readonly specialists: SpecialistsService,
    private readonly users: UsersService,
  ) {}

  async getDashboard(): Promise<DashboardReport> {
    const [
      hoy,
      ayer,
      minutosHoy,
      ingresosDia,
      topServicios,
      porCategoria,
      mesActual,
      mesAnterior,
      atendidas,
      cancelaciones,
      equipo,
      nuevasClientas,
    ] = await Promise.all([
      this.stats.resumenDelDia(0),
      this.stats.resumenDelDia(-1),
      this.stats.minutosReservadosHoy(),
      this.stats.ingresosPorDia(7),
      this.stats.serviciosMasSolicitados(5),
      this.stats.citasPorCategoria(),
      this.stats.resumenDelMes(0),
      this.stats.resumenDelMes(-1),
      this.stats.totalAtendidas(),
      this.stats.cancelacionesRecientes(7),
      this.specialists.findAll(),
      this.users.countNewClientsThisMonth(),
    ]);

    // Ocupación: minutos reservados sobre la capacidad del equipo disponible.
    const disponibles = equipo.filter((e) => e.status !== 'Descanso').length;
    const capacidad = disponibles * JORNADA_MIN;
    const occupancy =
      capacidad === 0 ? 0 : Math.min(100, Math.round((minutosHoy / capacidad) * 100));

    // El porcentaje del ranking es relativo al servicio más solicitado, para
    // que la barra más larga llene el ancho disponible.
    const maximo = topServicios[0]?.count ?? 1;
    const totalCategorias = porCategoria.reduce((s, c) => s + c.count, 0);

    const variacion =
      mesAnterior.ingresos === 0
        ? mesActual.ingresos > 0
          ? 100
          : 0
        : Math.round(
            ((mesActual.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos) * 100,
          );

    const totalMes = mesActual.citas + mesActual.canceladas;
    const tasaCancelacion =
      totalMes === 0
        ? 0
        : Math.round((mesActual.canceladas / totalMes) * 1000) / 10;

    return {
      kpis: [
        {
          label: 'Ingresos del mes',
          value: `$${mesActual.ingresos.toLocaleString('es-EC')}`,
          delta: `${variacion >= 0 ? '+' : ''}${variacion}% vs mes anterior`,
          positive: variacion >= 0,
        },
        {
          label: 'Citas atendidas',
          value: String(atendidas),
          delta: `${mesActual.citas} este mes`,
          positive: true,
        },
        {
          label: 'Nuevas clientas',
          value: String(nuevasClientas),
          delta: 'registradas este mes',
          positive: true,
        },
        {
          label: 'Tasa de cancelación',
          value: `${tasaCancelacion}%`,
          delta: `${mesActual.canceladas} canceladas`,
          positive: tasaCancelacion < 10,
        },
      ],
      revenueByDay: ingresosDia.map((d) => ({
        // `T12:00` evita que el navegador reinterprete la fecha en otra zona.
        day: DIAS[new Date(`${d.fecha}T12:00:00`).getDay()],
        value: Number(d.total),
      })),
      topServices: topServicios.map((s) => ({
        name: s.name,
        count: Number(s.count),
        pct: Math.round((Number(s.count) / maximo) * 100),
      })),
      byCategory: porCategoria.map((c) => ({
        category: c.category,
        color: c.color,
        pct:
          totalCategorias === 0
            ? 0
            : Math.round((Number(c.count) / totalCategorias) * 100),
      })),
      todayCount: hoy.citas,
      todayDelta: hoy.citas - ayer.citas,
      todayRevenue: hoy.ingresos,
      occupancy,
      cancellations: cancelaciones,
    };
  }

  /** Carga del equipo en una fecha: cuántas citas tiene cada especialista. */
  async getSpecialistLoad(fecha: string) {
    const [equipo, cargas] = await Promise.all([
      this.specialists.findAll(),
      this.stats.cargaPorEspecialista(fecha),
    ]);

    const porId = new Map(cargas.map((c) => [c.specialistId, Number(c.count)]));
    return equipo.map((specialist) => ({
      specialist,
      count: porId.get(specialist.id) ?? 0,
    }));
  }
}
