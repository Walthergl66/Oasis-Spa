import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

/**
 * Categoría de servicio (Uñas, Masaje, Facial…).
 *
 * En el prototipo la categoría era un texto suelto dentro del servicio. Se
 * modela como entidad propia porque cumple dos funciones del dominio: agrupa el
 * catálogo que filtra la clienta y define qué puede atender cada especialista.
 * Tenerla como tabla evita categorías escritas de formas distintas y permite
 * renombrarlas sin recorrer todos los servicios.
 */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 60 })
  name: string;

  /** Color usado en los reportes por categoría. */
  @Column({ type: 'varchar', length: 9, default: '#A98872' })
  color: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Service, (service) => service.category)
  services: Service[];
}
