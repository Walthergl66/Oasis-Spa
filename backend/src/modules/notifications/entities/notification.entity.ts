import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  RECORDATORIO = 'recordatorio',
  RESERVA = 'reserva',
  CANCELACION = 'cancelacion',
  PROMOCION = 'promocion',
  FIDELIDAD = 'fidelidad',
  SISTEMA = 'sistema',
}

/**
 * Aviso dirigido a un usuario (campana del encabezado).
 *
 * `type` clasifica el aviso para poder, más adelante, filtrar o desactivar
 * canales por tipo; `icon` es sólo presentación y viaja con el registro para no
 * codificar el mapeo en el frontend.
 */
@Entity({ schema: 'oasis', name: 'notifications' })
@Index(['userId', 'read'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SISTEMA,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 8, default: '' })
  icon: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', default: '' })
  text: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
