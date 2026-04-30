import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { NotificationOwnershipGuard } from './guards/notification-ownership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Appointment]), AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationOwnershipGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
