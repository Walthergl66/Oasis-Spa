import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { buildDatabaseConfig } from './config/database.config';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { CategoriesModule } from './modules/categories/categories.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ServicesModule } from './modules/services/services.module';
import { SpecialistsModule } from './modules/specialists/specialists.module';
import { UsersModule } from './modules/users/users.module';

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
 * Los guards se registran aquí como globales: **todo endpoint exige sesión
 * salvo que se marque con `@Public()`**. Es la política segura por defecto —
 * olvidar proteger algo no abre un agujero, sólo olvidar abrirlo da un 401.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),
    AuthModule,
    CategoriesModule,
    ServicesModule,
    SpecialistsModule,
    UsersModule,
    AppointmentsModule,
    ReviewsModule,
    PromotionsModule,
    NotificationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
