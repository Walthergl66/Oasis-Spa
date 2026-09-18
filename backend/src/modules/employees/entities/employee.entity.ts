import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { ServiceEntity } from '../../services/entities/service.entity.js';
import { EmployeeSchedule } from './employee-schedule.entity.js';

@Entity('employees')
export class EmployeeProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 150, nullable: true })
  specialty: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToMany(() => ServiceEntity, { eager: true })
  @JoinTable({
    name: 'employee_services',
    joinColumn: { name: 'employee_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  services: ServiceEntity[];

  @OneToMany(() => EmployeeSchedule, (schedule) => schedule.employee, {
    cascade: true,
  })
  schedules: EmployeeSchedule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
