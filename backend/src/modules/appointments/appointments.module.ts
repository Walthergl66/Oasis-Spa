import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ServicesModule } from '../services/services.module';
import { SpecialistsModule } from '../specialists/specialists.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsStatsService } from './appointments-stats.service';
import { Appointment } from './entities/appointment.entity';

/**
 * Módulo de citas: el que concentra la lógica de negocio del sistema.
 *
 * Es el que más dependencias tiene, y con razón: para calcular disponibilidad
 * necesita la duración del servicio y las categorías que atiende cada
 * especialista; al completar una cita acredita puntos a la clienta; y al
 * reservar, reprogramar o cancelar emite una notificación.
 *
 * Todas esas dependencias son módulos importados, no acceso directo a sus
 * tablas: si mañana cambia cómo se calculan los puntos, se cambia en un solo
 * sitio. Este módulo será también el que exponga las funciones que Luna ejecuta
 * en la Fase 3.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ServicesModule,
    SpecialistsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsStatsService],
  exports: [AppointmentsService, AppointmentsStatsService],
})
export class AppointmentsModule {}
