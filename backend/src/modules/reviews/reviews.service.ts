import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../../common/database-errors';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentStatus } from '../appointments/entities/appointment.entity';
import { ServicesService } from '../services/services.service';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entities/review.entity';

/**
 * Forma en la que una reseña sale hacia el frontend.
 *
 * La clienta y el servicio se aplana a sus nombres porque es el contrato que
 * las vistas ya consumen; `initials` se deriva del nombre (no existe columna).
 */
export interface ReviewResponse {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  initials: string;
  serviceId: string;
  serviceName: string;
  rating: number;
  text: string;
  createdAt: string;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Reseñas sobre citas completadas.
 *
 * Reglas que se imponen aquí y en el esquema:
 * - Sólo la dueña de la cita puede reseñarla, y sólo si está **completada**.
 * - Cada cita admite **una sola reseña**: la restricción UNIQUE de la base es
 *   el cierre definitivo; el 409 de aquí es para que el mensaje se entienda.
 * - Al publicar se recalcula `rating` y `reviewsCount` del servicio (datos
 *   denormalizados a propósito, como documenta la entidad).
 */
@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
    private readonly appointments: AppointmentsService,
    private readonly services: ServicesService,
  ) {}

  static toResponse(review: Review): ReviewResponse {
    return {
      id: review.id,
      appointmentId: review.appointmentId,
      clientId: review.clientId,
      clientName: review.client?.name ?? '',
      initials: initialsOf(review.client?.name ?? ''),
      serviceId: review.serviceId,
      serviceName: review.service?.name ?? '',
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async create(dto: CreateReviewDto, actor: User): Promise<ReviewResponse> {
    const cita = await this.appointments.getEntity(dto.appointmentId);

    if (cita.clientId !== actor.id) {
      throw new ForbiddenException(
        'Sólo puedes reseñar tus propias citas.',
      );
    }
    if (cita.status !== AppointmentStatus.COMPLETADA) {
      throw new BadRequestException(
        'Sólo puedes reseñar una cita completada.',
      );
    }
    if (cita.review) {
      throw new ConflictException('Esta cita ya tiene una reseña.');
    }

    const review = this.repository.create({
      appointmentId: cita.id,
      clientId: cita.clientId,
      serviceId: cita.serviceId,
      rating: dto.rating,
      text: dto.text?.trim() ?? '',
    });

    try {
      await this.repository.save(review);
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Carrera: otra petición publicó la reseña entre la comprobación y el INSERT.
        throw new ConflictException('Esta cita ya tiene una reseña.');
      }
      throw error;
    }

    await this.recalcularServicio(cita.serviceId);

    return ReviewsService.toResponse(await this.getEntity(review.id));
  }

  async findAll(
    options: { limit?: number; serviceId?: string } = {},
  ): Promise<ReviewResponse[]> {
    const query = this.consulta().orderBy('review.createdAt', 'DESC');

    if (options.serviceId) {
      query.andWhere('review.serviceId = :serviceId', {
        serviceId: options.serviceId,
      });
    }
    if (options.limit) {
      query.take(Math.min(options.limit, 100));
    }

    const reviews = await query.getMany();
    return reviews.map((review) => ReviewsService.toResponse(review));
  }

  async findOne(id: string): Promise<ReviewResponse> {
    return ReviewsService.toResponse(await this.getEntity(id));
  }

  private consulta() {
    return this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.client', 'client')
      .leftJoinAndSelect('review.service', 'service');
  }

  private async getEntity(id: string): Promise<Review> {
    const review = await this.consulta().where('review.id = :id', { id }).getOne();
    if (!review) throw new NotFoundException('La reseña no existe.');
    return review;
  }

  /** Promedia las reseñas del servicio y persiste el dato denormalizado. */
  private async recalcularServicio(serviceId: string): Promise<void> {
    const stats = await this.repository
      .createQueryBuilder('review')
      .select('COUNT(*)', 'total')
      .addSelect('AVG(review.rating)', 'promedio')
      .where('review.serviceId = :serviceId', { serviceId })
      .getRawOne<{ total: string; promedio: string | null }>();

    await this.services.recomputeRating(
      serviceId,
      Number(stats?.total ?? 0),
      Number(stats?.promedio ?? 0),
    );
  }
}
