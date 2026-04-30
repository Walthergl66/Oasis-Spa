import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Payment } from './entities/payment.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Service } from '../services/entities/service.entity';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Payment, User, Spa, Service, Employee]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
