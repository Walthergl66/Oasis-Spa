import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Service } from '../../services/entities/service.entity';
import { Favorite } from '../../users/entities/favorite.entity';
import { User } from '../../users/entities/user.entity';
import { SpaImage } from './spa-image.entity';

@Entity('spas')
export class Spa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'opening_time', type: 'time', nullable: true })
  openingTime: string | null;

  @Column({ name: 'closing_time', type: 'time', nullable: true })
  closingTime: string | null;

  @ManyToOne(() => User, (user) => user.ownedSpas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => SpaImage, (spaImage) => spaImage.spa)
  images: SpaImage[];

  @OneToMany(() => Service, (service) => service.spa)
  services: Service[];

  @OneToMany(() => Employee, (employee) => employee.spa)
  employees: Employee[];

  @OneToMany(() => Appointment, (appointment) => appointment.spa)
  appointments: Appointment[];

  @OneToMany(() => Review, (review) => review.spa)
  reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.spa)
  favorites: Favorite[];
}
