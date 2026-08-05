import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Service } from '../../services/entities/service.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Reseña de una clienta sobre una cita completada.
 *
 * La relación con la cita es uno a uno y única: la base impide dos reseñas de
 * la misma cita, sin depender de que el código lo valide. La restricción CHECK
 * garantiza además que la valoración esté entre 1 y 5.
 */
@Entity({ schema: 'oasis', name: 'reviews' })
@Check('"rating" >= 1 AND "rating" <= 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id', type: 'uuid', unique: true })
  appointmentId: string;

  @OneToOne(() => Appointment, (appointment) => appointment.review, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User, (user) => user.reviews, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, (service) => service.reviews, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', default: '' })
  text: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
