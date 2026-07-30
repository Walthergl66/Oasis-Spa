import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

/** Petición a la que el guard ya adjuntó el perfil autenticado. */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/** Claims que emite Supabase Auth en el access token. */
export interface SupabaseJwtPayload {
  /** Identificador del usuario: es también la clave del perfil. */
  sub: string;
  email?: string;
  aud?: string;
  exp?: number;
}
