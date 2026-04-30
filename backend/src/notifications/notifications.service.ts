import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService extends BaseCrudService<Notification> {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {
    super(notificationsRepository, 'Notification');
  }

  async create(createNotificationDto: CreateNotificationDto) {
    await this.ensureExists(this.usersRepository, createNotificationDto.userId, 'User');

    if (createNotificationDto.appointmentId) {
      await this.ensureExists(
        this.appointmentsRepository,
        createNotificationDto.appointmentId,
        'Appointment',
      );
    }

    return super.create(createNotificationDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['user', 'appointment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['user', 'appointment'],
    });
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    if (updateNotificationDto.userId) {
      await this.ensureExists(this.usersRepository, updateNotificationDto.userId, 'User');
    }

    if (updateNotificationDto.appointmentId) {
      await this.ensureExists(
        this.appointmentsRepository,
        updateNotificationDto.appointmentId,
        'Appointment',
      );
    }

    return super.update(id, updateNotificationDto);
  }
}
