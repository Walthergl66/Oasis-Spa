import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { buildDatabaseConfig } from './config/database.config';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { SpecialistsModule } from './modules/specialists/specialists.module';
import { UsersModule } from './modules/users/users.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

/**
 * Módulo raíz: arquitectura modular sobre un solo proceso.
 *
 * Cada dominio es un módulo con su entidad, su repositorio y su servicio; los
 * módulos se comunican inyectando el servicio del otro, nunca su repositorio.
 * Así el límite de responsabilidad es explícito y comprobable en el código.
 *
 * No son microservicios a propósito: crear una cita necesita leer la duración
 * del servicio y la agenda de la especialista dentro de la MISMA transacción, y
 * la restricción que impide solapes vive en una sola base de datos. Separar
 * esto en procesos obligaría a transacciones distribuidas sin ninguna ganancia
 * para el volumen de un spa.
 *
 * El orden de importación refleja las dependencias: primero las tablas base,
 * después los módulos que las consumen.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),
    CategoriesModule,
    ServicesModule,
    SpecialistsModule,
    UsersModule,
    AppointmentsModule,
    ReviewsModule,
    PromotionsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
