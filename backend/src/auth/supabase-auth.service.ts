import {
  ConflictException,
  BadGatewayException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/database.enums';
import { User } from '../users/entities/user.entity';
import { DevRegisterDto } from './dto/dev-register.dto';
import { SupabaseAdminUser } from './interfaces/supabase-admin-user.interface';
import { SupabasePasswordLoginResponse } from './interfaces/supabase-login-response.interface';
import {
  SupabaseAuthenticatedUser,
  SupabaseJwtPayload,
} from './interfaces/supabase-user.interface';

interface JwtHeader {
  alg?: string;
  typ?: string;
}

@Injectable()
export class SupabaseAuthService {
  private readonly supabaseUrl: string;
  private readonly jwtSecret: string;
  private readonly anonKey: string;
  private readonly serviceRoleKey: string;
  private readonly expectedAudience: string;
  private readonly expectedIssuer: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    this.supabaseUrl = this.configService
      .getOrThrow<string>('SUPABASE_URL')
      .replace(/\/$/, '');

    this.jwtSecret = this.configService.getOrThrow<string>(
      'SUPABASE_JWT_SECRET',
    );
    this.anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');
    this.serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.expectedAudience =
      this.configService.get<string>('JWT_AUDIENCE') ?? 'authenticated';
    this.expectedIssuer = `${this.supabaseUrl}/auth/v1`;
  }

  verifyAccessToken(token: string): SupabaseAuthenticatedUser {
    const payload = this.decodeAndVerifyJwt(token);

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid Supabase token subject');
    }

    return {
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      appMetadata: payload.app_metadata ?? {},
      userMetadata: payload.user_metadata ?? {},
      payload,
    };
  }

  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<SupabasePasswordLoginResponse> {
    const payload = await this.performPasswordLogin(credentials);

    if (!payload?.access_token) {
      throw new BadGatewayException('Supabase did not return an access token');
    }

    await this.syncUserProfile(payload.user);

    return payload;
  }

  async registerDevelopmentUser(
    payload: DevRegisterDto,
  ): Promise<SupabasePasswordLoginResponse> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
      },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        email_confirm: true,
        user_metadata: {
          full_name: payload.fullName,
          avatar_url: payload.avatarUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as
        | { msg?: string; message?: string; error?: string }
        | null;
      const message =
        errorBody?.msg ??
        errorBody?.message ??
        errorBody?.error ??
        'Supabase registration failed';

      if (/already/i.test(message)) {
        throw new ConflictException(message);
      }

      throw new BadGatewayException(message);
    }

    const createdUser = (await response.json()) as SupabaseAdminUser | null;

    if (!createdUser?.id) {
      throw new BadGatewayException('Supabase did not return the created user');
    }

    await this.syncUserProfile(createdUser, payload.fullName, payload.avatarUrl);

    return this.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
  }

  private decodeAndVerifyJwt(token: string): SupabaseJwtPayload {
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const header = this.parseJwtPart<JwtHeader>(encodedHeader);
    const payload = this.parseJwtPart<SupabaseJwtPayload>(encodedPayload);

    if (header.alg !== 'HS256') {
      throw new UnauthorizedException('Unsupported JWT algorithm');
    }

    this.verifySignature(`${encodedHeader}.${encodedPayload}`, signature);
    this.verifyRegisteredClaims(payload);

    return payload;
  }

  private parseJwtPart<T>(value: string): T {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
    } catch {
      throw new UnauthorizedException('Invalid JWT payload');
    }
  }

  private verifySignature(data: string, signature: string): void {
    const expectedSignature = createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest();
    const receivedSignature = Buffer.from(signature, 'base64url');

    if (
      expectedSignature.length !== receivedSignature.length ||
      !timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      throw new UnauthorizedException('Invalid JWT signature');
    }
  }

  private verifyRegisteredClaims(payload: SupabaseJwtPayload): void {
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp <= currentTimestamp) {
      throw new UnauthorizedException('Expired Supabase token');
    }

    if (payload.nbf && payload.nbf > currentTimestamp) {
      throw new UnauthorizedException('Supabase token is not active yet');
    }

    if (!this.hasExpectedAudience(payload.aud)) {
      throw new UnauthorizedException('Invalid Supabase token audience');
    }

    if (payload.iss && payload.iss !== this.expectedIssuer) {
      throw new UnauthorizedException('Invalid Supabase token issuer');
    }

    if (!this.jwtSecret) {
      throw new InternalServerErrorException('Supabase JWT secret is not set');
    }
  }

  private hasExpectedAudience(audience: string | string[] | undefined): boolean {
    if (Array.isArray(audience)) {
      return audience.includes(this.expectedAudience);
    }

    return audience === this.expectedAudience;
  }

  private async performPasswordLogin(credentials: {
    email: string;
    password: string;
  }): Promise<SupabasePasswordLoginResponse | null> {
    const response = await fetch(
      `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.anonKey,
        },
        body: JSON.stringify(credentials),
      },
    );

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as
        | { msg?: string; error_description?: string; error?: string }
        | null;

      throw new UnauthorizedException(
        errorBody?.msg ??
          errorBody?.error_description ??
          errorBody?.error ??
          'Supabase login failed',
      );
    }

    return (await response.json()) as SupabasePasswordLoginResponse | null;
  }

  private async syncUserProfile(
    authUser: SupabaseAdminUser,
    fallbackFullName?: string,
    fallbackAvatarUrl?: string,
  ): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { id: authUser.id },
    });

    const fullName = this.extractString(authUser.user_metadata?.full_name)
      ?? fallbackFullName
      ?? authUser.email?.split('@')[0]
      ?? 'Oasis Spa User';
    const avatarUrl =
      this.extractString(authUser.user_metadata?.avatar_url) ?? fallbackAvatarUrl;

    if (existingUser) {
      existingUser.fullName = existingUser.fullName || fullName;
      existingUser.avatarUrl = existingUser.avatarUrl ?? avatarUrl ?? null;
      existingUser.phone = existingUser.phone ?? authUser.phone ?? null;
      existingUser.isActive = true;

      return this.usersRepository.save(existingUser);
    }

    const newUser = this.usersRepository.create({
      id: authUser.id,
      fullName,
      phone: authUser.phone ?? null,
      avatarUrl: avatarUrl ?? null,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    return this.usersRepository.save(newUser);
  }

  private extractString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : undefined;
  }
}
