import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

/**
 * Consultas agregadas sobre la agenda.
 *
 * Vive dentro del módulo de citas porque es quien posee la tabla: el módulo de
 * reportes compone y presenta, pero no consulta `appointments` por su cuenta.
 *
 * Todas las agrupaciones por día usan `AT TIME ZONE 'America/Guayaquil'`: una
 * cita de las 20:00 en Manta cae en UTC del día siguiente, y agrupar por el día
 * UTC desplazaría los ingresos de la tarde al día equivocado.
 */
@Injectable()
export class AppointmentsStatsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repository: Repository<Appointment>,
  ) {}

  private static readonly TZ = 'America/Guayaquil';

  /** Citas e ingresos de un día concreto (sin contar las canceladas). */
  async resumenDelDia(offsetDias = 0): Promise<{ citas: number; ingresos: number }> {
    const fila = await this.repository
      .createQueryBuilder('cita')
      .select('COUNT(*)', 'citas')
      .addSelect('COALESCE(SUM(cita.price), 0)', 'ingresos')
      .where('cita.status != :cancelada', {
        cancelada: AppointmentStatus.CANCELADA,
      })
      .andWhere(
        `(cita.starts_at AT TIME ZONE '${AppointmentsStatsService.TZ}')::date
         = (now() AT TIME ZONE '${AppointmentsStatsService.TZ}')::date + :offset::int`,
        { offset: offsetDias },
      )
      .getRawOne<{ citas: string; ingresos: string }>();

    return {
      citas: Number(fila?.citas ?? 0),
      ingresos: Number(fila?.ingresos ?? 0),
    };
  }

  /** Minutos ya reservados hoy: numerador de la ocupación. */
  async minutosReservadosHoy(): Promise<number> {
    const fila = await this.repository
      .createQueryBuilder('cita')
      .select('COALESCE(SUM(cita.duration_min), 0)', 'minutos')
      .where('cita.status != :cancelada', {
        cancelada: AppointmentStatus.CANCELADA,
      })
      .andWhere(
        `(cita.starts_at AT TIME ZONE '${AppointmentsStatsService.TZ}')::date
         = (now() AT TIME ZONE '${AppointmentsStatsService.TZ}')::date`,
      )
      .getRawOne<{ minutos: string }>();

    return Number(fila?.minutos ?? 0);
  }

  /**
   * Ingresos de los últimos `dias` días, un registro por día.
   *
   * Se genera la serie con `generate_series` y se hace LEFT JOIN para que los
   * días sin citas aparezcan con cero en lugar de desaparecer del gráfico.
   */
  async ingresosPorDia(dias = 7): Promise<{ fecha: string; total: number }[]> {
    const filas = await this.repository.query(
      `
      WITH serie AS (
        SELECT generate_series(
          (now() AT TIME ZONE $1)::date - ($2::int - 1),
          (now() AT TIME ZONE $1)::date,
          '1 day'::interval
        )::date AS fecha
      )
      SELECT
        serie.fecha::text AS fecha,
        COALESCE(SUM(a.price), 0)::float AS total
      FROM serie
      LEFT JOIN "oasis"."appointments" a
        ON (a.starts_at AT TIME ZONE $1)::date = serie.fecha
       AND a.status <> 'cancelada'
      GROUP BY serie.fecha
      ORDER BY serie.fecha
      `,
      [AppointmentsStatsService.TZ, dias],
    );
    return filas as { fecha: string; total: number }[];
  }

  /** Servicios más solicitados, sin contar las canceladas. */
  async serviciosMasSolicitados(
    limite = 5,
  ): Promise<{ name: string; count: number }[]> {
    const filas = await this.repository
      .createQueryBuilder('cita')
      .innerJoin('cita.service', 'service')
      .select('service.name', 'name')
      .addSelect('COUNT(*)::int', 'count')
      .where('cita.status != :cancelada', {
        cancelada: AppointmentStatus.CANCELADA,
      })
      .groupBy('service.name')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limite)
      .getRawMany<{ name: string; count: number }>();
    return filas;
  }

  /** Distribución de citas por categoría de servicio. */
  async citasPorCategoria(): Promise<
    { category: string; color: string; count: number }[]
  > {
    return this.repository
      .createQueryBuilder('cita')
      .innerJoin('cita.service', 'service')
      .innerJoin('service.category', 'category')
      .select('category.name', 'category')
      .addSelect('category.color', 'color')
      .addSelect('COUNT(*)::int', 'count')
      .where('cita.status != :cancelada', {
        cancelada: AppointmentStatus.CANCELADA,
      })
      .groupBy('category.name')
      .addGroupBy('category.color')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{ category: string; color: string; count: number }>();
  }

  /** Totales de un mes: 0 = mes actual, -1 = mes anterior. */
  async resumenDelMes(
    offsetMeses = 0,
  ): Promise<{ citas: number; ingresos: number; canceladas: number }> {
    const filas = await this.repository.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status <> 'cancelada')::int AS citas,
        COALESCE(SUM(price) FILTER (WHERE status <> 'cancelada'), 0)::float AS ingresos,
        COUNT(*) FILTER (WHERE status = 'cancelada')::int AS canceladas
      FROM "oasis"."appointments"
      WHERE date_trunc('month', starts_at AT TIME ZONE $1)
          = date_trunc('month', (now() AT TIME ZONE $1) + ($2 || ' month')::interval)
      `,
      [AppointmentsStatsService.TZ, offsetMeses],
    );
    const fila = (filas as { citas: number; ingresos: number; canceladas: number }[])[0];
    return fila ?? { citas: 0, ingresos: 0, canceladas: 0 };
  }

  /** Citas completadas en toda la historia. */
  async totalAtendidas(): Promise<number> {
    return this.repository.count({
      where: { status: AppointmentStatus.COMPLETADA },
    });
  }

  /** Cancelaciones de los últimos días. */
  async cancelacionesRecientes(dias = 7): Promise<number> {
    const fila = await this.repository
      .createQueryBuilder('cita')
      .select('COUNT(*)::int', 'total')
      .where('cita.status = :cancelada', {
        cancelada: AppointmentStatus.CANCELADA,
      })
      .andWhere(`cita.starts_at >= now() - (:dias || ' days')::interval`, {
        dias,
      })
      .getRawOne<{ total: number }>();
    return Number(fila?.total ?? 0);
  }

  /** Carga de trabajo de cada especialista en una fecha. */
  async cargaPorEspecialista(
    fecha: string,
  ): Promise<{ specialistId: string; count: number }[]> {
    return this.repository
      .createQueryBuilder('cita')
      .select('cita.specialist_id', 'specialistId')
      .addSelect('COUNT(*)::int', 'count')
      .where('cita.status != :cancelada', {
        cancelada: AppointmentStatus.CANCELADA,
      })
      .andWhere(
        `(cita.starts_at AT TIME ZONE '${AppointmentsStatsService.TZ}')::date = :fecha::date`,
        { fecha },
      )
      .groupBy('cita.specialist_id')
      .getRawMany<{ specialistId: string; count: number }>();
  }
}
