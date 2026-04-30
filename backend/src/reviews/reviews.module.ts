import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Review } from './entities/review.entity';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
import { ReviewOwnershipGuard } from './guards/review-ownership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Appointment, User, Spa]), AuthModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewOwnershipGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}
