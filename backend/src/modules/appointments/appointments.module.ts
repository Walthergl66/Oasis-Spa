import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity.js';
import { AppointmentsService } from './appointments.service.js';
import { AppointmentsController } from './appointments.controller.js';
import { ServicesModule } from '../services/services.module.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { AvailabilityModule } from '../availability/availability.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ServicesModule,
    EmployeesModule,
    AvailabilityModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
