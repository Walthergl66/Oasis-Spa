import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericTransformer } from '../../../common/numeric.transformer';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

export enum SpecialistStatus {
  DISPONIBLE = 'Disponible',
  EN_CITA = 'En cita',
  DESCANSO = 'Descanso',
}

/**
 * Especialista del spa: quien atiende la cita.
 *
 * `categories` es lo que hace posible asignar automáticamente: al consultar
 * disponibilidad sólo se consideran las especialistas cuya categoría coincide
 * con la del servicio solicitado.
 *
 * `userId` es opcional a propósito: el spa puede registrar a una especialista
 * para agendarla antes de que tenga cuenta en el sistema.
 */
@Entity('specialists')
export class Specialist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  /** Descripción corta del rol: "Nail art & manicura". */
  @Column({ type: 'varchar', length: 120, default: '' })
  role: string;

  /** Iniciales para el avatar; se derivan del nombre al guardar. */
  @Column({ type: 'varchar', length: 4, default: '' })
  initials: string;

  @Column({
    type: 'numeric',
    precision: 2,
    scale: 1,
    default: 5,
    transformer: numericTransformer,
  })
  rating: number;

  @Column({
    type: 'enum',
    enum: SpecialistStatus,
    default: SpecialistStatus.DISPONIBLE,
  })
  status: SpecialistStatus;

  @Index()
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @OneToOne(() => User, (user) => user.specialistProfile, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  /** Categorías de servicio que está habilitada para atender. */
  @ManyToMany(() => Category)
  @JoinTable({
    name: 'specialist_categories',
    joinColumn: { name: 'specialist_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => Appointment, (appointment) => appointment.specialist)
  appointments: Appointment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
