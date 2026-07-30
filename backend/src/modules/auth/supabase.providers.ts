import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

/**
 * Tipo del cliente tal como lo devuelve `createClient`.
 *
 * Se infiere en lugar de anotar `SupabaseClient` a secas porque los parámetros
 * genéricos por defecto de ambos no coinciden y el compilador lo señala.
 */
export type SupabaseAuthClient = ReturnType<typeof createClient>;

/** Cliente con la clave pública: se usa para iniciar sesión y refrescar. */
export const SUPABASE_PUBLIC = 'SUPABASE_PUBLIC';

/**
 * Cliente con la clave `service_role`: crea cuentas sin confirmación por correo
 * y puede revocar sesiones. NUNCA debe llegar al navegador.
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
