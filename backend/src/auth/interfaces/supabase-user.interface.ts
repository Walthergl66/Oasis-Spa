export interface SupabaseJwtPayload {
  sub: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  email?: string;
  phone?: string;
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export interface SupabaseAuthenticatedUser {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
  payload: SupabaseJwtPayload;
}
