import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { EmployeeProfile } from '../../employees/entities/employee.entity.js';
import { ServiceEntity } from '../../services/entities/service.entity.js';
import { AppointmentStatus } from '../enums/appointment-status.enum.js';

@Entity('appointments')
@Index(['employeeId', 'startTime', 'endTime'])
@Index(['clientId', 'status'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => EmployeeProfile, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeProfile;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => ServiceEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_by_id', nullable: true })
  cancelledById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by_id' })
  cancelledBy: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
