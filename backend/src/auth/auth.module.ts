import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [SupabaseAuthService, SupabaseAuthGuard],
  exports: [SupabaseAuthService, SupabaseAuthGuard],
})
export class AuthModule {}
