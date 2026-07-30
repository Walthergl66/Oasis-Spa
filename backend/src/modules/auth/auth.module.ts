import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtVerifierService } from './jwt-verifier.service';
import { supabaseProviders } from './supabase.providers';

/**
 * Módulo de autenticación.
 *
 * Es `@Global` porque los guards se registran de forma global en `AppModule` y
 * necesitan resolver sus dependencias desde cualquier módulo. Los clientes de
 * Supabase se exportan por si otro módulo necesitara operar sobre cuentas (por
 * ejemplo, el panel al dar de alta a una especialista).
 */
@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtVerifierService,
    JwtAuthGuard,
    RolesGuard,
    ...supabaseProviders,
  ],
  exports: [
    AuthService,
    JwtVerifierService,
    JwtAuthGuard,
    RolesGuard,
    ...supabaseProviders,
  ],
})
export class AuthModule {}
