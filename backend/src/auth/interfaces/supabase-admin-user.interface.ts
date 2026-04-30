export interface SupabaseAdminUser {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}
