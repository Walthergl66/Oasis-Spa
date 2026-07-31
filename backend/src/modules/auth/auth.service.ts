import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { IsNull, LessThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';

export interface AuthResult {
  user: User;
  accessToken: string;
  /** Viaja en una cookie httpOnly; nunca en el cuerpo de la respuesta. */
  refreshToken: string;
  /** Segundos de vida del access token. */
  expiresIn: number;
}

/** Contenido del access token. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
}

/** Coste de bcrypt: equilibrio entre seguridad y tiempo de respuesta. */
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokens: Repository<RefreshToken>,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get accessTtl(): number {
    return Number(this.config.get<string>('JWT_ACCESS_TTL', '900'));
  }

  private get refreshTtlDays(): number {
    return Number(this.config.get<string>('JWT_REFRESH_TTL_DAYS', '30'));
  }

  /** El token viaja en claro al navegador; en la base sólo queda su hash. */
  private static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const user = await this.users.createProfile({
      name: dto.name,
      email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      phone: dto.phone,
      city: dto.city,
    });

    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmailWithPassword(email);

    // Se compara siempre contra un hash —aunque la cuenta no exista— para no
    // revelar por tiempo de respuesta qué correos están registrados.
    const hash =
      user?.passwordHash ??
      '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    const valid = await bcrypt.compare(dto.password, hash);

    if (!user || !valid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    if (!user.active) {
      throw new UnauthorizedException('Esta cuenta está desactivada.');
    }

    // El perfil se recarga sin el hash para no arrastrarlo en la respuesta.
    return this.issueSession(await this.users.getById(user.id));
  }

  /**
   * Renueva la sesión rotando el refresh token.
   *
   * Si llega un token ya revocado significa que alguien reutilizó una cookie
   * antigua: o se copió, o quedó cacheada. Ante la duda se revocan TODAS las
   * sesiones de la cuenta, que es la respuesta estándar a una posible fuga.
   */
  async refresh(presented: string): Promise<AuthResult> {
    const stored = await this.tokens.findOne({
      where: { tokenHash: AuthService.hash(presented) },
    });

    if (!stored) throw new UnauthorizedException('Sesión no válida.');

    if (stored.revokedAt) {
      this.logger.warn(
        `Refresh token reutilizado (usuario ${stored.userId}): se cierran todas sus sesiones.`,
      );
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException(
        'Detectamos un uso indebido de la sesión. Inicia sesión de nuevo.',
      );
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(
        'La sesión expiró. Inicia sesión de nuevo.',
      );
    }

    const user = await this.users.findById(stored.userId);
    if (!user || !user.active) {
      throw new UnauthorizedException('La cuenta ya no está disponible.');
    }

    stored.revokedAt = new Date();
    await this.tokens.save(stored);

    return this.issueSession(user);
  }

  async logout(presented: string | null): Promise<void> {
    if (!presented) return;
    await this.tokens.update(
      { tokenHash: AuthService.hash(presented), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.tokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /** Emite access token y refresh token, y registra la sesión. */
  private async issueSession(user: User): Promise<AuthResult> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessTtl,
    });

    // Aleatorio y opaco: el refresh token no necesita transportar información,
    // sólo identificar una fila de `refresh_tokens`.
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays);

    await this.tokens.save(
      this.tokens.create({
        userId: user.id,
        tokenHash: AuthService.hash(refreshToken),
        expiresAt,
      }),
    );

    await this.purgeExpired(user.id);

    return { user, accessToken, refreshToken, expiresIn: this.accessTtl };
  }

  /** Limpia sesiones caducadas para que la tabla no crezca indefinidamente. */
  private async purgeExpired(userId: string): Promise<void> {
    await this.tokens.delete({ userId, expiresAt: LessThan(new Date()) });
  }
}
