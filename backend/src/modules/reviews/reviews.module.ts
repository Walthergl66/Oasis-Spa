import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ServicesModule } from '../services/services.module';
import { Review } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

/**
 * Módulo de reseñas.
 *
 * Usa `AppointmentsService` para comprobar que la cita reseñada existe, es de
 * la clienta y está completada (los módulos se comunican por servicio, nunca
 * por repositorio), y `ServicesService` para recalcular el promedio de
 * valoraciones del servicio al publicar una reseña.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Review]), AppointmentsModule, ServicesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
