import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscriptionEntity } from './entities/push-subscription.entity.js';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscriptionEntity, Appointment])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
