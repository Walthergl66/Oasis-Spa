import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { AvailabilityService } from './availability.service.js';
import { AvailabilityController } from './availability.controller.js';
import { ServicesModule } from '../services/services.module.js';
import { EmployeesModule } from '../employees/employees.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ServicesModule,
    EmployeesModule,
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
