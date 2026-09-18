import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployeeProfile } from './employee.entity.js';

@Entity('employee_schedules')
export class EmployeeSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => EmployeeProfile, (emp) => emp.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeProfile;

  @Column({ name: 'day_of_week', type: 'smallint', comment: '0=Domingo, 1=Lunes, ..., 6=Sábado' })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'varchar', length: 10, default: '09:00' })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar', length: 10, default: '18:00' })
  endTime: string;

  @Column({ name: 'break_start', type: 'varchar', length: 10, nullable: true, default: '13:00' })
  breakStart: string | null;

  @Column({ name: 'break_end', type: 'varchar', length: 10, nullable: true, default: '14:00' })
  breakEnd: string | null;

  @Column({ name: 'is_working_day', default: true })
  isWorkingDay: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
