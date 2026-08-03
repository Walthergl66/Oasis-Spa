import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isExclusionViolation } from '../../common/database-errors';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ServicesService } from '../services/services.service';
import { Specialist } from '../specialists/entities/specialist.entity';
import { SpecialistsService } from '../specialists/specialists.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  RescheduleAppointmentDto,
  UpdateStatusDto,
} from './dto/update-appointment.dto';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

/**
 * Zona horaria del establecimiento.
 *
 * Ecuador continental no aplica horario de verano, así que un desfase fijo es
 * correcto y evita depender de la zona horaria del servidor: la misma reserva
 * produce el mismo instante se ejecute la API donde se ejecute.
 */
const DESFASE_SPA = '-05:00';

/** Horario de atención por día de la semana (0 = domingo). */
export const HORARIO: Record<number, { abre: string; cierra: string } | null> =
  {
    0: { abre: '10:00', cierra: '14:00' },
    1: { abre: '09:00', cierra: '18:00' },
    2: { abre: '09:00', cierra: '18:00' },
    3: { abre: '09:00', cierra: '18:00' },
    4: { abre: '09:00', cierra: '18:00' },
    5: { abre: '09:00', cierra: '18:00' },
    6: { abre: '09:00', cierra: '18:00' },
  };

/** Granularidad de la agenda, en minutos. */
export const PASO_MINUTOS = 30;

/** Estados que ocupan agenda. Cancelada y completada la liberan. */
const ESTADOS_ACTIVOS = [
  AppointmentStatus.PENDIENTE,
  AppointmentStatus.CONFIRMADA,
];

export interface FranjaDisponible {
  time: string;
  available: boolean;
  specialistIds: string[];
}

export interface DisponibilidadResponse {
  date: string;
  serviceId: string;
  slots: FranjaDisponible[];
}

export interface AppointmentResponse {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  specialistId: string;
  specialistName: string;
  start: string;
  end: string;
  durationMin: number;
  price: number;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  reviewed: boolean;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repository: Repository<Appointment>,
    private readonly services: ServicesService,
    private readonly specialists: SpecialistsService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------------------------------------------------------- utilidades

  /** Combina fecha y hora del spa en un instante absoluto. */
  private static instante(date: string, time: string): Date {
    const fecha = new Date(`${date}T${time}:00${DESFASE_SPA}`);
    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('Fecha u hora no válidas.');
    }
    return fecha;
  }

  /** Día del spa como intervalo [inicio, fin) en instantes absolutos. */
  private static dia(date: string): { desde: Date; hasta: Date } {
    const desde = AppointmentsService.instante(date, '00:00');
    const hasta = new Date(desde.getTime() + 24 * 60 * 60 * 1000);
    return { desde, hasta };
  }

  /** Día de la semana según el calendario del spa, no el del servidor. */
  private static diaSemana(date: string): number {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  }

  private static minutos(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private static hora(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  static toResponse(appointment: Appointment): AppointmentResponse {
    return {
      id: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.client?.name ?? '',
      serviceId: appointment.serviceId,
      serviceName: appointment.service?.name ?? '',
      specialistId: appointment.specialistId,
      specialistName: appointment.specialist?.name ?? '',
      start: appointment.startsAt.toISOString(),
      end: appointment.endsAt?.toISOString() ?? '',
      durationMin: appointment.durationMin,
      price: appointment.price,
      status: appointment.status,
      notes: appointment.notes,
      createdAt: appointment.createdAt.toISOString(),
      // Se deriva de la relación: no hay bandera que pueda desincronizarse.
      reviewed: Boolean(appointment.review),
    };
  }

  private consulta() {
    return this.repository
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.client', 'client')
      .leftJoinAndSelect('cita.service', 'service')
      .leftJoinAndSelect('cita.specialist', 'specialist')
      .leftJoin('cita.review', 'review')
      .addSelect('review.id');
  }

  // ------------------------------------------------------------ disponibilidad

  /**
   * Horarios libres de un servicio en una fecha.
   *
   * Para cada franja se calcula qué especialistas —de las habilitadas en la
   * categoría del servicio— tienen el bloque completo libre. Una franja está
   * disponible si al menos una puede atenderla.
   *
   * `excluirCitaId` sirve al reprogramar: la propia cita no debe bloquearse a
   * sí misma su horario actual.
   */
  async getAvailability(
    serviceId: string,
    date: string,
    excluirCitaId?: string,
  ): Promise<DisponibilidadResponse> {
    const service = await this.services.getEntity(serviceId);

    const horario = HORARIO[AppointmentsService.diaSemana(date)];
    if (!horario) return { date, serviceId, slots: [] };

    const candidatas = await this.specialists.findAvailableForCategory(
      service.categoryId,
    );
    if (candidatas.length === 0) return { date, serviceId, slots: [] };

    const { desde, hasta } = AppointmentsService.dia(date);
    const ocupadas = await this.repository
      .createQueryBuilder('cita')
      .where('cita.status IN (:...estados)', { estados: ESTADOS_ACTIVOS })
      .andWhere('cita.startsAt >= :desde AND cita.startsAt < :hasta', {
        desde,
        hasta,
      })
      .andWhere(
        excluirCitaId ? 'cita.id != :excluirCitaId' : '1=1',
        excluirCitaId ? { excluirCitaId } : {},
      )
      .getMany();

    const apertura = AppointmentsService.minutos(horario.abre);
    const cierre = AppointmentsService.minutos(horario.cierra);
    const ahora = Date.now();
    const slots: FranjaDisponible[] = [];

    for (
      let m = apertura;
      m + service.durationMin <= cierre;
      m += PASO_MINUTOS
    ) {
      const time = AppointmentsService.hora(m);
      const inicio = AppointmentsService.instante(date, time);
      const fin = new Date(inicio.getTime() + service.durationMin * 60_000);

      // Un horario que ya pasó no se ofrece.
      if (inicio.getTime() <= ahora) {
        slots.push({ time, available: false, specialistIds: [] });
        continue;
      }

      const libres = candidatas
        .filter((especialista) =>
          ocupadas.every(
            (cita) =>
              cita.specialistId !== especialista.id ||
              cita.endsAt <= inicio ||
              cita.startsAt >= fin,
          ),
        )
        .map((especialista) => especialista.id);

      slots.push({ time, available: libres.length > 0, specialistIds: libres });
    }

    return { date, serviceId, slots };
  }

  // ------------------------------------------------------------------ consulta

  async findForClient(
    clientId: string,
    scope: 'upcoming' | 'history',
  ): Promise<AppointmentResponse[]> {
    const query = this.consulta().where('cita.clientId = :clientId', {
      clientId,
    });

    if (scope === 'upcoming') {
      query
        .andWhere('cita.status IN (:...estados)', { estados: ESTADOS_ACTIVOS })
        .andWhere('cita.startsAt >= :ahora', { ahora: new Date() })
        .orderBy('cita.startsAt', 'ASC');
    } else {
      query
        .andWhere('(cita.status IN (:...cerrados) OR cita.startsAt < :ahora)', {
          cerrados: [AppointmentStatus.COMPLETADA, AppointmentStatus.CANCELADA],
          ahora: new Date(),
        })
        .orderBy('cita.startsAt', 'DESC');
    }

    const citas = await query.getMany();
    return citas.map((c) => AppointmentsService.toResponse(c));
  }

  /** Agenda de un día concreto, para el panel administrativo. */
  async getAgenda(date: string): Promise<AppointmentResponse[]> {
    const { desde, hasta } = AppointmentsService.dia(date);
    const citas = await this.consulta()
      .where('cita.startsAt >= :desde AND cita.startsAt < :hasta', {
        desde,
        hasta,
      })
      .orderBy('cita.startsAt', 'ASC')
      .getMany();
    return citas.map((c) => AppointmentsService.toResponse(c));
  }

  async getEntity(id: string): Promise<Appointment> {
    const cita = await this.consulta().where('cita.id = :id', { id }).getOne();
    if (!cita) throw new NotFoundException('La cita no existe.');
    return cita;
  }

  /** Una clienta sólo puede ver y tocar sus propias citas. */
  private comprobarPropiedad(cita: Appointment, actor: User): void {
    if (actor.role === UserRole.CLIENTE && cita.clientId !== actor.id) {
      throw new ForbiddenException('Esta cita no te pertenece.');
    }
  }

  async findOne(id: string, actor: User): Promise<AppointmentResponse> {
    const cita = await this.getEntity(id);
    this.comprobarPropiedad(cita, actor);
    return AppointmentsService.toResponse(cita);
  }

  // -------------------------------------------------------------------- reserva

  /**
   * Registra una cita.
   *
   * Valida disponibilidad antes de insertar, pero **no confía sólo en esa
   * validación**: entre la comprobación y el INSERT puede colarse otra reserva.
   * Esa carrera la corta la restricción `appointments_no_overlap` de la base, y
   * aquí se traduce a un 409 con un mensaje que la clienta entiende.
   */
  async create(
    dto: CreateAppointmentDto,
    actor: User,
  ): Promise<AppointmentResponse> {
    // El personal puede reservar a nombre de otra; la clienta, sólo para sí.
    const clientId =
      actor.role === UserRole.CLIENTE ? actor.id : (dto.clientId ?? actor.id);

    const client = await this.users.getById(clientId);
    const service = await this.services.getEntity(dto.serviceId);

    const disponibilidad = await this.getAvailability(dto.serviceId, dto.date);
    const franja = disponibilidad.slots.find((s) => s.time === dto.time);

    if (!franja) {
      throw new BadRequestException(
        'Ese horario está fuera del horario de atención del spa.',
      );
    }
    if (!franja.available) {
      throw new ConflictException(
        'Ese horario ya está reservado. Elige otro, por favor.',
      );
    }

    const specialist = await this.elegirEspecialista(
      franja,
      dto.specialistId,
      dto.date,
    );

    const cita = this.repository.create({
      clientId: client.id,
      serviceId: service.id,
      specialistId: specialist.id,
      startsAt: AppointmentsService.instante(dto.date, dto.time),
      durationMin: service.durationMin,
      price: service.price,
      status: AppointmentStatus.CONFIRMADA,
      notes: dto.notes?.trim() ?? '',
      createdVia: actor.role === UserRole.CLIENTE ? 'app' : 'recepcion',
    });

    let guardada: Appointment;
    try {
      guardada = await this.repository.save(cita);
    } catch (error) {
      if (isExclusionViolation(error)) {
        // Otra reserva ganó la carrera entre la validación y el INSERT.
        throw new ConflictException(
          'Ese horario acaba de ser reservado por otra persona. Elige otro, por favor.',
        );
      }
      throw error;
    }

    await this.notifications.emit({
      userId: client.id,
      type: NotificationType.RESERVA,
      icon: '✓',
      title: 'Reserva confirmada',
      text: `${service.name} el ${dto.date} a las ${dto.time} con ${specialist.name}.`,
    });

    return AppointmentsService.toResponse(await this.getEntity(guardada.id));
  }

  /**
   * Decide quién atiende.
   *
   * Si la clienta eligió especialista, se respeta —siempre que esté libre—. Si
   * no, se reparte la carga: entre las disponibles, la que menos citas tiene
   * ese día.
   */
  private async elegirEspecialista(
    franja: FranjaDisponible,
    pedida: string | undefined,
    date: string,
  ): Promise<Specialist> {
    if (pedida) {
      if (!franja.specialistIds.includes(pedida)) {
        throw new ConflictException(
          'Esa especialista no está disponible en ese horario.',
        );
      }
      return this.specialists.getEntity(pedida);
    }

    const { desde, hasta } = AppointmentsService.dia(date);
    const cargas = await this.repository
      .createQueryBuilder('cita')
      .select('cita.specialist_id', 'id')
      .addSelect('COUNT(*)', 'total')
      .where('cita.specialist_id IN (:...ids)', { ids: franja.specialistIds })
      .andWhere('cita.status IN (:...estados)', { estados: ESTADOS_ACTIVOS })
      .andWhere('cita.startsAt >= :desde AND cita.startsAt < :hasta', {
        desde,
        hasta,
      })
      .groupBy('cita.specialist_id')
      .getRawMany<{ id: string; total: string }>();

    const carga = new Map(cargas.map((c) => [c.id, Number(c.total)]));
    const elegida = [...franja.specialistIds].sort(
      (a, b) => (carga.get(a) ?? 0) - (carga.get(b) ?? 0),
    )[0];

    return this.specialists.getEntity(elegida);
  }

  // --------------------------------------------------------------- modificación

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    actor: User,
  ): Promise<AppointmentResponse> {
    const cita = await this.getEntity(id);
    this.comprobarPropiedad(cita, actor);

    if (!ESTADOS_ACTIVOS.includes(cita.status)) {
      throw new BadRequestException(
        'Sólo se pueden reprogramar citas pendientes o confirmadas.',
      );
    }

    const disponibilidad = await this.getAvailability(
      cita.serviceId,
      dto.date,
      cita.id,
    );
    const franja = disponibilidad.slots.find((s) => s.time === dto.time);
    if (!franja?.available) {
      throw new ConflictException('Ese horario ya no está disponible.');
    }

    // Se conserva la especialista actual si sigue libre; si no, se reasigna.
    const preferida =
      dto.specialistId ??
      (franja.specialistIds.includes(cita.specialistId)
        ? cita.specialistId
        : undefined);
    const specialist = await this.elegirEspecialista(
      franja,
      preferida,
      dto.date,
    );

    cita.startsAt = AppointmentsService.instante(dto.date, dto.time);
    cita.specialistId = specialist.id;
    cita.status = AppointmentStatus.CONFIRMADA;

    try {
      await this.repository.save(cita);
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new ConflictException(
          'Ese horario acaba de ser ocupado. Elige otro, por favor.',
        );
      }
      throw error;
    }

    await this.notifications.emit({
      userId: cita.clientId,
      type: NotificationType.RESERVA,
      icon: '📅',
      title: 'Cita reprogramada',
      text: `${cita.service?.name ?? 'Tu cita'} quedó para el ${dto.date} a las ${dto.time}.`,
    });

    return AppointmentsService.toResponse(await this.getEntity(id));
  }

  async cancel(
    id: string,
    reason: string | undefined,
    actor: User,
  ): Promise<AppointmentResponse> {
    const cita = await this.getEntity(id);
    this.comprobarPropiedad(cita, actor);

    if (cita.status === AppointmentStatus.COMPLETADA) {
      throw new BadRequestException(
        'Una cita completada no se puede cancelar.',
      );
    }
    if (cita.status === AppointmentStatus.CANCELADA) {
      throw new BadRequestException('Esta cita ya estaba cancelada.');
    }

    cita.status = AppointmentStatus.CANCELADA;
    cita.cancelledAt = new Date();
    cita.cancelReason = reason?.trim() || null;
    await this.repository.save(cita);

    await this.notifications.emit({
      userId: cita.clientId,
      type: NotificationType.CANCELACION,
      icon: '✕',
      title: 'Cita cancelada',
      text: `Tu cita de ${cita.service?.name ?? 'servicio'} fue cancelada. Puedes reservar otra cuando quieras.`,
    });

    return AppointmentsService.toResponse(await this.getEntity(id));
  }

  /**
   * Cambio de estado desde el panel.
   *
   * Al pasar a `completada` se acreditan los puntos de fidelidad. La condición
   * `!estabaCompletada` evita que marcarla dos veces pague dos veces.
   */
  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
  ): Promise<AppointmentResponse> {
    const cita = await this.getEntity(id);

    if (cita.status === AppointmentStatus.CANCELADA) {
      throw new BadRequestException(
        'Una cita cancelada no cambia de estado. Debe crearse una nueva.',
      );
    }

    const estabaCompletada = cita.status === AppointmentStatus.COMPLETADA;
    cita.status = dto.status;
    await this.repository.save(cita);

    if (dto.status === AppointmentStatus.COMPLETADA && !estabaCompletada) {
      const puntos = await this.users.addPoints(cita.clientId, cita.price);
      await this.notifications.emit({
        userId: cita.clientId,
        type: NotificationType.FIDELIDAD,
        icon: '⭐',
        title: '¡Ganaste puntos!',
        text: `Sumaste ${Math.round(cita.price)} puntos por tu visita. Ya tienes ${puntos} pts.`,
      });
    }

    return AppointmentsService.toResponse(await this.getEntity(id));
  }
}
