import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
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
  private readonly jwtSecret: string;
  private readonly expectedAudience: string;
  private readonly expectedIssuer: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService
      .getOrThrow<string>('SUPABASE_URL')
      .replace(/\/$/, '');

    this.jwtSecret = this.configService.getOrThrow<string>(
      'SUPABASE_JWT_SECRET',
    );
    this.expectedAudience =
      this.configService.get<string>('JWT_AUDIENCE') ?? 'authenticated';
    this.expectedIssuer = `${supabaseUrl}/auth/v1`;
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
}
