import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
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
 * Persona del sistema: clienta, especialista o administración.
 *
 * Un solo `users` con rol, en lugar de tablas separadas, porque los tres tipos
 * comparten identidad y autenticación. Los datos propios del trabajo
 * (especialidades, valoración, estado) viven en `specialists`, enlazada uno a
 * uno.
 *
 * La autenticación es propia del sistema: aquí se guarda el hash de la
 * contraseña —nunca la contraseña— y las sesiones activas viven en
 * `refresh_tokens`.
 *
 * `points` y `level` se almacenan en lugar de recalcularse en cada consulta:
 * son parte del estado del programa de fidelidad y cambian sólo cuando una cita
 * pasa a completada.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  email: string;

  /**
   * Hash bcrypt de la contraseña.
   *
   * `select: false` hace que NO se incluya en las consultas normales: para
   * filtrarlo habría que acordarse en cada `find`, y basta un descuido para
   * devolverlo en una respuesta. Quien lo necesita (el login) lo pide de forma
   * explícita.
   */
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;

  /**
   * Correo confirmado mediante el enlace enviado al registrarse.
   *
   * La columna existe desde el inicio aunque el envío por SMTP llegue después:
   * añadirla más tarde obligaría a otra migración sobre datos ya cargados.
   */
  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

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
