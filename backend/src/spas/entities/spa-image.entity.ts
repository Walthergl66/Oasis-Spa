import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Spa } from './spa.entity';

@Entity('spa_images')
export class SpaImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Spa, (spa) => spa.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spa_id' })
  spa: Spa;

  @Column({ name: 'spa_id', type: 'uuid' })
  spaId: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
