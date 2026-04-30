import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseAuthService],
  exports: [SupabaseAuthService],
})
export class AuthModule {}
