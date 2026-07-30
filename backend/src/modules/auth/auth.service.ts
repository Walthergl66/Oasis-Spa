import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { SupabaseAuthClient } from './supabase.providers';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SUPABASE_ADMIN, SUPABASE_PUBLIC } from './supabase.providers';

export interface AuthResult {
  user: User;
  accessToken: string;
  /** Viaja en una cookie httpOnly; nunca en el cuerpo de la respuesta. */
  refreshToken: string;
  expiresIn: number;
}

/**
 * Autenticación contra Supabase Auth.
 *
 * NestJS actúa de intermediario a propósito: la aplicación web nunca habla
 * directamente con GoTrue. Eso permite fijar el refresh token en una cookie
 * httpOnly —que el JavaScript del navegador no puede leer— y devolver sólo el
 * access token, que la aplicación mantiene en memoria. Si el frontend usara
 * `supabase-js` directamente, la sesión quedaría en localStorage, accesible a
 * cualquier script inyectado.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_PUBLIC) private readonly supabase: SupabaseAuthClient,
    @Inject(SUPABASE_ADMIN) private readonly supabaseAdmin: SupabaseAuthClient,
    private readonly users: UsersService,
  ) {}

  /** Alta de una clienta: cuenta en Supabase Auth + perfil de dominio. */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { name: dto.name },
    });

    if (error || !data.user) {
      const taken = /already|registered|exists/i.test(error?.message ?? '');
      if (taken) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      throw new InternalServerErrorException(
        `No se pudo crear la cuenta: ${error?.message ?? 'error desconocido'}`,
      );
    }

    try {
      await this.users.createProfile({
        id: data.user.id,
        name: dto.name,
        email,
        phone: dto.phone,
        city: dto.city,
      });
    } catch (profileError) {
      // Si el perfil falla, la cuenta de autenticación quedaría huérfana:
      // se revierte para que el correo pueda volver a registrarse.
      await this.supabaseAdmin.auth.admin.deleteUser(data.user.id);
      throw profileError;
    }

    return this.login({ email, password: dto.password });
  }

  /** Inicio de sesión con correo y contraseña. */
  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const user = await this.users.findById(data.user.id);
    if (!user) {
      // Cuenta creada fuera del sistema (por ejemplo, desde el panel de
      // Supabase) que nunca llegó a tener perfil.
      throw new UnauthorizedException('La cuenta no tiene un perfil asociado.');
    }
    if (!user.active) {
      throw new UnauthorizedException('Esta cuenta está desactivada.');
    }

    return {
      user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  /**
   * Renueva la sesión a partir del refresh token de la cookie. Supabase rota el
   * refresh token en cada uso, así que la cookie debe reescribirse siempre.
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(
        'La sesión expiró. Inicia sesión de nuevo.',
      );
    }

    const user = await this.users.findById(data.user.id);
    if (!user || !user.active) {
      throw new UnauthorizedException('La cuenta ya no está disponible.');
    }

    return {
      user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  /** Revoca la sesión en Supabase; los errores no impiden cerrar sesión local. */
  async logout(accessToken: string | null): Promise<void> {
    if (!accessToken) return;
    try {
      await this.supabaseAdmin.auth.admin.signOut(accessToken);
    } catch {
      // La cookie se borra igualmente: para la usuaria, la sesión ya terminó.
    }
  }
}
