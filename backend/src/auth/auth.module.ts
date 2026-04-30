import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseAuthService, SupabaseAuthGuard],
  exports: [SupabaseAuthService, SupabaseAuthGuard],
})
export class AuthModule {}
