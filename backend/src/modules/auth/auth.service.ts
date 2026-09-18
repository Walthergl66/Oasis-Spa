import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto, TokensDto } from './dto/auth-response.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { Role } from '../../common/enums/role.enum.js';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  async hashData(data: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(data, saltRounds);
  }

  async compareData(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new BadRequestException('El correo ya se encuentra registrado');
    }

    const passwordHash = await this.hashData(registerDto.password);
    const user = await this.usersService.create(
      {
        ...registerDto,
        role: Role.CLIENT,
      },
      passwordHash,
    );

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: UserResponseDto.fromEntity(user),
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tu cuenta se encuentra desactivada');
    }

    const passwordMatches = await this.compareData(
      loginDto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: UserResponseDto.fromEntity(user),
      tokens,
    };
  }

  async refreshToken(userId: string, refreshToken: string): Promise<TokensDto> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new ForbiddenException('Acceso denegado');
    }

    const refreshTokenMatches = await this.compareData(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Token de actualización inválido o expirado');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<TokensDto> {
    const payload = { sub: userId, email, role };

    const accessSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'oasis_spa_jwt_secret_key_titulacion_2026_super_secure';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'oasis_spa_refresh_secret_key_titulacion_2026_super_secure';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hash = await this.hashData(refreshToken);
    await this.usersService.updateRefreshToken(userId, hash);
  }

  async seedAdmin(): Promise<void> {
    const adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') || 'admin@oasisspa.com';
    const existingAdmin = await this.usersService.findByEmail(adminEmail);

    if (!existingAdmin) {
      this.logger.log(`Creando usuario administrador inicial: ${adminEmail}`);
      const adminPassword =
        this.configService.get<string>('ADMIN_PASSWORD') || 'Admin1234*';
      const passwordHash = await this.hashData(adminPassword);

      await this.usersService.create(
        {
          email: adminEmail,
          password: adminPassword,
          firstName:
            this.configService.get<string>('ADMIN_FIRST_NAME') || 'Administrador',
          lastName: this.configService.get<string>('ADMIN_LAST_NAME') || 'Oasis',
          phone:
            this.configService.get<string>('ADMIN_PHONE') || '+593999999999',
          role: Role.ADMIN,
        },
        passwordHash,
      );
      this.logger.log('✅ Administrador inicial creado con éxito.');
    }
  }
}
