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

/**
 * Sesión activa de un usuario.
 *
 * Se guarda el **hash** del refresh token, nunca el token: si alguien leyera
 * esta tabla no podría suplantar ninguna sesión, igual que con las contraseñas.
 *
 * Que las sesiones estén en la base —y no sólo en un JWT sin estado— permite
 * dos cosas que un token autocontenido no puede dar: cerrar sesión de verdad
 * (revocar) y detectar reutilización de un token ya rotado, que es la señal
 * clásica de que alguien copió la cookie.
 */
@Entity('refresh_tokens')
@Index(['userId', 'revokedAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** SHA-256 del token entregado al navegador. */
  @Index({ unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /** Fecha de revocación: al rotar, al cerrar sesión o al detectar robo. */
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
