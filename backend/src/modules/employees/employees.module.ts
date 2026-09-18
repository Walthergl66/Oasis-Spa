import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeProfile } from './entities/employee.entity.js';
import { EmployeeSchedule } from './entities/employee-schedule.entity.js';
import { ServiceEntity } from '../services/entities/service.entity.js';
import { EmployeesService } from './employees.service.js';
import { EmployeesController } from './employees.controller.js';
import { UsersModule } from '../users/users.module.js';
import { ServicesModule } from '../services/services.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeProfile,
      EmployeeSchedule,
      ServiceEntity,
    ]),
    UsersModule,
    ServicesModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, TypeOrmModule],
})
export class EmployeesModule {}
