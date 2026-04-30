import { Request } from 'express';
import { SupabaseAuthenticatedUser } from './supabase-user.interface';
import type { User } from '../../users/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: SupabaseAuthenticatedUser;
  profile?: User;
}
