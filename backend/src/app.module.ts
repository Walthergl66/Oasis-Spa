import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { validate } from './config/env.validation.js';
import { typeOrmConfigAsync } from './config/database.config.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ServicesModule } from './modules/services/services.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { AvailabilityModule } from './modules/availability/availability.module.js';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AssistantModule } from './modules/assistant/assistant.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { AppointmentExclusionService } from './database/exclusions/appointment-exclusion.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    UsersModule,
    AuthModule,
    ServicesModule,
    EmployeesModule,
    AvailabilityModule,
    AppointmentsModule,
    NotificationsModule,
    AssistantModule,
    DashboardModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppointmentExclusionService],
})
export class AppModule {}
