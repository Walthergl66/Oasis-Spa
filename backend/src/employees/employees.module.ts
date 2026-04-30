import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
import { EmployeeOwnershipGuard } from './guards/employee-ownership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, User, Spa]), AuthModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeOwnershipGuard],
  exports: [EmployeesService],
})
export class EmployeesModule {}
