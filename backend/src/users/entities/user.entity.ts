import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { ChatSession } from '../../chat/entities/chat.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Spa } from '../../spas/entities/spa.entity';
import { Favorite } from './favorite.entity';
import { UserRole } from '../../common/enums/database.enums';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Spa, (spa) => spa.owner)
  ownedSpas: Spa[];

  @OneToMany(() => Employee, (employee) => employee.user)
  employeeProfiles: Employee[];

  @OneToMany(() => Appointment, (appointment) => appointment.customer)
  customerAppointments: Appointment[];

  @OneToMany(() => Review, (review) => review.customer)
  reviews: Review[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => ChatSession, (chatSession) => chatSession.user)
  chatSessions: ChatSession[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}
