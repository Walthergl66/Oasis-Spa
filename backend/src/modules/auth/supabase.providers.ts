import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

/**
 * Tipo del cliente tal como lo devuelve `createClient`. Se infiere en lugar de
 * anotar `SupabaseClient` porque los genéricos por defecto de ambos difieren.
 */
export type SupabaseAuthClient = ReturnType<typeof createClient>;

/** Clave pública: iniciar sesión, registrar, refrescar y recuperar clave. */
export const SUPABASE_PUBLIC = 'SUPABASE_PUBLIC';

/**
 * Clave `service_role`: crea cuentas sin confirmación, cambia contraseñas y
 * revoca sesiones. NUNCA debe llegar al navegador.
 */
export const SUPABASE_ADMIN = 'SUPABASE_ADMIN';

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
};

export const supabaseProviders: Provider[] = [
  {
    provide: SUPABASE_PUBLIC,
    inject: [ConfigService],
    useFactory: (config: ConfigService): SupabaseAuthClient =>
      createClient(
        config.getOrThrow<string>('SUPABASE_URL'),
        config.getOrThrow<string>('SUPABASE_ANON_KEY'),
        clientOptions,
      ),
  },
  {
    provide: SUPABASE_ADMIN,
    inject: [ConfigService],
    useFactory: (config: ConfigService): SupabaseAuthClient =>
      createClient(
        config.getOrThrow<string>('SUPABASE_URL'),
        config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
        clientOptions,
      ),
  },
];
