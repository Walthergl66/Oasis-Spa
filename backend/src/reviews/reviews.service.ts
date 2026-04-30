import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
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
