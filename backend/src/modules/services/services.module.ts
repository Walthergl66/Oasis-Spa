import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { Service } from './entities/service.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

/**
 * Módulo del catálogo de servicios.
 *
 * Depende de `CategoriesModule` porque un servicio siempre pertenece a una
 * categoría y esa validación corresponde al dueño de la tabla, no a este módulo.
 * Se exporta `ServicesService` para que citas y promociones puedan consultar el
 * catálogo sin acceder a su repositorio.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Service]), CategoriesModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
