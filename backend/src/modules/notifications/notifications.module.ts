import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Módulo de notificaciones.
 *
 * No depende de nadie a propósito: es un servicio de salida al que otros
 * módulos (citas, promociones) le piden emitir un aviso. Mantenerlo sin
 * dependencias evita ciclos y permitirá añadir correo o push en un solo punto.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
