import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ServicesModule } from '../services/services.module';
import { Review } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

/**
 * Módulo de reseñas.
 *
 * Registra `Appointment` en modo lectura para comprobar que la cita reseñada
 * existe y está completada, y usa `ServicesService` para recalcular el promedio
 * de valoraciones del servicio al publicar una reseña.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Review, Appointment]), ServicesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
