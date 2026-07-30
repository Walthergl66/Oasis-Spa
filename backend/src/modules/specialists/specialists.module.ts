import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { Specialist } from './entities/specialist.entity';
import { SpecialistsController } from './specialists.controller';
import { SpecialistsService } from './specialists.service';

/**
 * Módulo de especialistas.
 *
 * Necesita las categorías para saber qué puede atender cada una; el módulo de
 * citas consumirá `SpecialistsService` al calcular disponibilidad.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Specialist]), CategoriesModule],
  controllers: [SpecialistsController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
