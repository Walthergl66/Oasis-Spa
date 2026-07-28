import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Módulo de usuarios (clientas, personal y administración).
 *
 * Registra también `Service` porque gestiona los favoritos de la clienta, que
 * viven en la tabla de unión `user_favorite_services`.
 *
 * `UsersService` se exporta para que el futuro módulo de autenticación valide
 * credenciales sin duplicar el acceso a la tabla.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Service])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
