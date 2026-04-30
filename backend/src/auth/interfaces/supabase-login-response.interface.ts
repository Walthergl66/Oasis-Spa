export interface SupabasePasswordLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    role?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  };
}
