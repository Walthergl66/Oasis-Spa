import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Service } from '../../services/entities/service.entity';
import { Specialist } from '../../specialists/entities/specialist.entity';

export enum UserRole {
  CLIENTE = 'cliente',
  ESPECIALISTA = 'especialista',
  ADMIN = 'admin',
}

export enum LoyaltyLevel {
  BRONCE = 'Bronce',
  AMBAR = 'Ámbar',
  ORO = 'Oro',
}

/**
 * Perfil de una persona del sistema: clienta, especialista o administración.
 *
 * La IDENTIDAD (credenciales, sesiones, confirmación de correo, recuperación
 * de contraseña) no vive aquí: la gestiona Supabase Auth en `auth.users`. Esta
 * tabla es el perfil de dominio y su `id` es el mismo identificador que emite
 * Supabase, de modo que hay exactamente un perfil por cuenta y la relación no
 * puede desincronizarse. Por eso el id NO se autogenera.
 *
 * Tampoco se replica aquí si el correo está confirmado: ese estado vive en
 * `auth.users.email_confirmed_at`, y duplicarlo sólo crearía dos fuentes de
 * verdad que pueden desincronizarse.
 *
 * Un solo `users` con rol, en lugar de tablas separadas, porque los tres tipos
 * comparten identidad. Los datos propios del trabajo (especialidades,
 * valoración, estado) viven en `specialists`, enlazada uno a uno.
 *
 * `points` y `level` se almacenan en lugar de recalcularse en cada consulta:
 * son parte del estado del programa de fidelidad y cambian sólo cuando una cita
 * pasa a completada.
 */
@Entity('users')
export class User {
  /** Igual a `auth.users.id`. Lo asigna Supabase Auth, no la base. */
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 30, default: '' })
  phone: string;

  @Column({ type: 'varchar', length: 120, default: 'Manta, Manabí' })
  city: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENTE })
  role: UserRole;

  @Column({ name: 'member_since', type: 'date', default: () => 'CURRENT_DATE' })
  memberSince: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'enum', enum: LoyaltyLevel, default: LoyaltyLevel.BRONCE })
  level: LoyaltyLevel;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  /** Servicios marcados como favoritos por la clienta. */
  @ManyToMany(() => Service)
  @JoinTable({
    name: 'user_favorite_services',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  favoriteServices: Service[];

  /** Perfil profesional, sólo si el usuario forma parte del equipo. */
  @OneToOne(() => Specialist, (specialist) => specialist.user)
  specialistProfile: Specialist;

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  appointments: Appointment[];

  @OneToMany(() => Review, (review) => review.client)
  reviews: Review[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
