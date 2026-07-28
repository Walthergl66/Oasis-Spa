import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from '../services/services.module';
import { Promotion } from './entities/promotion.entity';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

/**
 * Módulo de promociones.
 *
 * Depende del catálogo porque una promoción siempre apunta a servicios
 * concretos (tabla `promotion_services`).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Promotion]), ServicesModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
