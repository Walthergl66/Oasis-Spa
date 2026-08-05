import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericTransformer } from '../../../common/numeric.transformer';
import { Service } from '../../services/entities/service.entity';

export enum PromotionColor {
  TERRACOTA = 'terracota',
  ROSA = 'rosa',
  VERDE = 'verde',
  DORADO = 'dorado',
}

/**
 * Promoción comercial.
 *
 * `services` es muchos a muchos porque una promoción puede cubrir varios
 * servicios (el combo masaje + facial) y un servicio puede estar en varias
 * promociones a la vez.
 *
 * Se guardan `startsAt`/`endsAt` además del texto de vigencia: el texto es para
 * la clienta, las fechas son las que permiten filtrar promociones vigentes sin
 * intervención manual.
 */
@Entity({ schema: 'oasis', name: 'promotions' })
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Etiqueta visible: "-30%", "2x1". */
  @Column({ type: 'varchar', length: 12, default: '' })
  badge: string;

  @Column({
    type: 'enum',
    enum: PromotionColor,
    default: PromotionColor.TERRACOTA,
  })
  color: PromotionColor;

  /** Texto de vigencia mostrado a la clienta: "Todos los martes". */
  @Column({ name: 'valid_text', type: 'varchar', length: 120, default: '' })
  validText: string;

  @Column({
    name: 'price_before',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  priceBefore: number | null;

  @Column({
    name: 'price_now',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  priceNow: number | null;

  @Column({ name: 'image_url', type: 'varchar', length: 255, default: '' })
  imageUrl: string;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Index()
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToMany(() => Service)
  @JoinTable({
    name: 'promotion_services',
    joinColumn: { name: 'promotion_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  services: Service[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
