import { Request } from 'express';
import { SupabaseAuthenticatedUser } from './supabase-user.interface';

export interface AuthenticatedRequest extends Request {
  user?: SupabaseAuthenticatedUser;
}
