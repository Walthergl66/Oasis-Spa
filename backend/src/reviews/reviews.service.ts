import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewPublicDto } from './dto/create-review-public.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService extends BaseCrudService<Review> {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Spa)
    private readonly spasRepository: Repository<Spa>,
  ) {
    super(reviewsRepository, 'Review');
  }

  async create(createReviewDto: CreateReviewDto) {
    await Promise.all([
      this.ensureExists(
        this.appointmentsRepository,
        createReviewDto.appointmentId,
        'Appointment',
      ),
      this.ensureExists(this.usersRepository, createReviewDto.customerId, 'User'),
      this.ensureExists(this.spasRepository, createReviewDto.spaId, 'Spa'),
    ]);

    return super.create(createReviewDto);
  }

  async createPublic(profile: User, dto: CreateReviewPublicDto) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: dto.appointmentId },
      select: { id: true, customerId: true, spaId: true },
    });

    if (!appointment) throw new BadRequestException('Appointment not found');
    if (appointment.customerId !== profile.id) {
      throw new BadRequestException('You can only review your own appointment');
    }

    await Promise.all([
      this.ensureExists(this.usersRepository, profile.id, 'User'),
      this.ensureExists(this.spasRepository, appointment.spaId, 'Spa'),
    ]);

    return super.create({
      appointmentId: dto.appointmentId,
      customerId: profile.id,
      spaId: appointment.spaId,
      rating: dto.rating,
      comment: dto.comment ?? undefined,
    });
  }

  async findMine(profile: User) {
    return super.findAll({
      where: { customerId: profile.id } as any,
      relations: ['appointment', 'spa'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll() {
    return super.findAll({
      relations: ['appointment', 'customer', 'spa'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['appointment', 'customer', 'spa'],
    });
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    if (updateReviewDto.appointmentId) {
      await this.ensureExists(
        this.appointmentsRepository,
        updateReviewDto.appointmentId,
        'Appointment',
      );
    }

    if (updateReviewDto.customerId) {
      await this.ensureExists(this.usersRepository, updateReviewDto.customerId, 'User');
    }

    if (updateReviewDto.spaId) {
      await this.ensureExists(this.spasRepository, updateReviewDto.spaId, 'Spa');
    }

    return super.update(id, updateReviewDto);
  }
}
