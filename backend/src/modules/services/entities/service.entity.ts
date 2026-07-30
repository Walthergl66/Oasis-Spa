import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Review } from '../../reviews/entities/review.entity';

/**
 * Servicio del spa: lo que la clienta reserva.
 *
 * `durationMin` no es informativo: es el dato con el que se calcula si una
 * franja horaria cabe antes del cierre y si se solapa con otra cita.
 *
 * `rating` y `reviewsCount` se guardan denormalizados (se recalculan al
 * publicar una reseña) para no agregar sobre `reviews` en cada listado del
 * catálogo, que es la consulta más frecuente de la aplicación.
 */
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.services, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /** Duración en minutos. Define el bloque que ocupa en la agenda. */
  @Column({ name: 'duration_min', type: 'int' })
  durationMin: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'image_url', type: 'varchar', length: 255, default: '' })
  imageUrl: string;

  /** Se destaca en la portada de la clienta. */
  @Column({ type: 'boolean', default: false })
  popular: boolean;

  /** Promedio de valoraciones; se recalcula al crear una reseña. */
  @Column({ type: 'numeric', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ name: 'reviews_count', type: 'int', default: 0 })
  reviewsCount: number;

  /**
   * Baja lógica. Un servicio con citas registradas nunca se borra: se desactiva
   * para no romper el historial ni los reportes.
   */
  @Index()
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];

  @OneToMany(() => Review, (review) => review.service)
  reviews: Review[];
}
