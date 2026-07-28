import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

/**
 * Módulo de categorías.
 *
 * `forFeature` publica el repositorio de la entidad sólo dentro de este módulo:
 * ningún otro puede tocar la tabla `categories` por su cuenta, tiene que pasar
 * por `CategoriesService`. Ese límite es lo que hace modular a la arquitectura.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
