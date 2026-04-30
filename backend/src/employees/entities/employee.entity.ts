import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Availability } from '../../availability/entities/availability.entity';
import { Spa } from '../../spas/entities/spa.entity';
import { User } from '../../users/entities/user.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.employeeProfiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Spa, (spa) => spa.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spa_id' })
  spa: Spa;

  @Column({ name: 'spa_id', type: 'uuid' })
  spaId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  specialty: string | null;

  @Column({ type: 'text', nullable: true })
  biography: string | null;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({
    name: 'commission_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionPercentage: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Availability, (availability) => availability.employee)
  availabilities: Availability[];

  @OneToMany(() => Appointment, (appointment) => appointment.employee)
  appointments: Appointment[];
}
