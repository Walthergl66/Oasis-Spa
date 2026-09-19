import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Appointment } from '../../appointments/entities/appointment.entity.js';

export enum PaymentMethod {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  TARJETA = 'TARJETA',
}

export enum PaymentStatus {
  REGISTRADO = 'REGISTRADO',
  ANULADO = 'ANULADO',
}

/**
 * Anticipo/depósito que respalda una cita (Sprint 7).
 * Un solo anticipo REGISTRADO por cita; las correcciones
 * anulan el registro en vez de borrarlo (trazabilidad).
 */
@Entity('payments')
@Index(['appointmentId'])
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @ManyToOne(() => Appointment, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.REGISTRADO })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'received_by_id', nullable: true })
  receivedById: string | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'received_by_id' })
  receivedBy: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
