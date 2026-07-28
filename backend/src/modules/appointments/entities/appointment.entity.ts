import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { Service } from '../../services/entities/service.entity';
import { Specialist } from '../../specialists/entities/specialist.entity';
import { User } from '../../users/entities/user.entity';

export enum AppointmentStatus {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}

/**
 * Cita: el corazón del sistema.
 *
 * Decisiones del modelo:
 *
 * - Se guarda `startsAt` (timestamptz) y no fecha y hora por separado: así el
 *   solape entre citas es una comparación de intervalos, no aritmética de dos
 *   columnas. La zona horaria importa porque el spa opera en America/Guayaquil.
 *
 * - `durationMin` y `price` se copian del servicio al crear la cita. Es
 *   redundancia deliberada: si mañana sube el precio o cambia la duración, el
 *   historial y los reportes deben seguir reflejando lo que se cobró ese día.
 *
 * - No existe columna `reviewed`: se deriva de la relación con `review`. Un
 *   booleano paralelo podría quedar desincronizado con la tabla de reseñas.
 *
 * - Cancelar nunca borra la fila: cambia el estado y libera la franja. El
 *   historial de cancelaciones alimenta el indicador de la tesis.
 */
@Entity('appointments')
@Index(['specialistId', 'startsAt'])
@Index(['clientId', 'startsAt'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User, (user) => user.appointments, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, (service) => service.appointments, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'specialist_id', type: 'uuid' })
  specialistId: string;

  @ManyToOne(() => Specialist, (specialist) => specialist.appointments, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'specialist_id' })
  specialist: Specialist;

  /** Inicio de la cita. El fin se obtiene sumando `durationMin`. */
  @Index()
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  /**
   * Fin de la cita. Lo calcula un trigger en la base a partir de `startsAt` y
   * `durationMin`; la aplicación nunca lo escribe (`insert`/`update` en false).
   *
   * Existe como columna porque la restricción que impide solapes necesita un
   * rango con expresión IMMUTABLE, y `starts_at + interval` no lo es.
   */
  @Column({
    name: 'ends_at',
    type: 'timestamptz',
    insert: false,
    update: false,
    select: true,
  })
  endsAt: Date;

  /** Duración vigente al momento de reservar. */
  @Column({ name: 'duration_min', type: 'int' })
  durationMin: number;

  /** Precio vigente al momento de reservar. */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Index()
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDIENTE,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', default: '' })
  notes: string;

  /** Canal por el que se registró: útil para medir el aporte de Luna. */
  @Column({ name: 'created_via', type: 'varchar', length: 20, default: 'app' })
  createdVia: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({
    name: 'cancel_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  cancelReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  /** Reseña asociada, si la clienta ya valoró esta cita. */
  @OneToOne(() => Review, (review) => review.appointment)
  review: Review | null;
}
