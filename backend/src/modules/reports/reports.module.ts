import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { SpecialistsModule } from '../specialists/specialists.module';
import { UsersModule } from '../users/users.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * Reportes del panel.
 *
 * No registra ninguna entidad con `forFeature`: no posee tablas. Compone datos
 * que le entregan los módulos dueños de cada una, que es exactamente el límite
 * que define la arquitectura.
 */
@Module({
  imports: [AppointmentsModule, SpecialistsModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
