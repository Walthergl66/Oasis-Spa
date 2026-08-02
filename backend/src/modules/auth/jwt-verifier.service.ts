import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from 'jose';
import type { SupabaseJwtPayload } from './types/authenticated-request';

/**
 * Verificación del access token emitido por Supabase Auth.
 *
 * Supabase firma los tokens de usuario con **claves asimétricas** (ES256) y
 * publica la clave pública en un JWKS. El backend verifica con esa clave
 * pública y NO necesita conocer el secreto de firma: si el servidor se ve
 * comprometido, el atacante no obtiene con qué emitir tokens válidos.
 *
 * Se mantiene el soporte para HS256 porque los proyectos de Supabase creados
 * antes del cambio —y algunas instalaciones autoalojadas— firman con secreto
 * compartido. La rama se decide leyendo el algoritmo de la cabecera.
 *
 * La verificación es local: no se consulta a GoTrue en cada petición, lo que
 * costaría una llamada de red por request.
 */
@Injectable()
export class JwtVerifierService {
  private readonly logger = new Logger(JwtVerifierService.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly sharedSecret: Uint8Array | null;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY', '');

    this.jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
      // La pasarela exige la clave pública para exponer el JWKS.
      { headers: anonKey ? { apikey: anonKey } : undefined },
    );

    const secret = this.config.get<string>('SUPABASE_JWT_SECRET', '');
    this.sharedSecret = secret ? new TextEncoder().encode(secret) : null;
  }

  async verify(token: string): Promise<SupabaseJwtPayload> {
    let algorithm: string | undefined;
    try {
      algorithm = decodeProtectedHeader(token).alg;
    } catch {
      throw new UnauthorizedException('Token de acceso mal formado.');
    }

    try {
      const payload = await this.verifyWith(token, algorithm);
      if (!payload.sub) {
        throw new UnauthorizedException('El token no identifica a un usuario.');
      }
      return payload as SupabaseJwtPayload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      const message = error instanceof Error ? error.message : '';
      if (/expired/i.test(message)) {
        throw new UnauthorizedException('La sesión expiró.');
      }
      this.logger.debug(`Token rechazado: ${message}`);
      throw new UnauthorizedException('Token de acceso no válido.');
    }
  }

  private async verifyWith(
    token: string,
    algorithm: string | undefined,
  ): Promise<JWTPayload> {
    if (algorithm?.startsWith('HS')) {
      if (!this.sharedSecret) {
        throw new UnauthorizedException(
          'El token está firmado con secreto compartido, pero SUPABASE_JWT_SECRET no está configurado.',
        );
      }
      const { payload } = await jwtVerify(token, this.sharedSecret);
      return payload;
    }

    const { payload } = await jwtVerify(token, this.jwks);
    return payload;
  }
}
