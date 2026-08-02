import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  SUPABASE_ADMIN,
  SUPABASE_PUBLIC,
  type SupabaseAuthClient,
} from './supabase.providers';

export interface AuthResult {
  user: User;
  accessToken: string;
  /** Viaja en una cookie httpOnly; nunca en el cuerpo de la respuesta. */
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResult {
  /** Perfil creado. La sesión llega tras confirmar el correo. */
  user: User;
  emailVerificationRequired: boolean;
}

/**
 * Autenticación sobre Supabase Auth (GoTrue).
 *
 * NestJS actúa de intermediario a propósito: la aplicación web nunca habla
 * directamente con GoTrue. Eso permite fijar el refresh token en una cookie
 * httpOnly —que el JavaScript del navegador no puede leer— y devolver sólo el
 * access token, que la aplicación mantiene en memoria. Si el frontend usara
 * `supabase-js` directamente, la sesión quedaría en localStorage, accesible a
 * cualquier script inyectado.
 *
 * Se delega en Supabase justo lo que es costoso y delicado de mantener en
 * producción: almacenamiento de contraseñas, confirmación de correo,
 * recuperación de contraseña y límite de intentos.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_PUBLIC) private readonly supabase: SupabaseAuthClient,
    @Inject(SUPABASE_ADMIN) private readonly supabaseAdmin: SupabaseAuthClient,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private get appUrl(): string {
    return this.config.get<string>('APP_URL', 'http://localhost:5173');
  }

  /**
   * Alta de una clienta.
   *
   * Usa `signUp` (no la API de administración) para que GoTrue **envíe el
   * correo de confirmación**. Hasta que la usuaria haga clic en el enlace no
   * podrá iniciar sesión: por eso aquí no se devuelve sesión alguna.
   */
  async register(dto: RegisterDto): Promise<RegisterResult> {
    const email = dto.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: dto.password,
      options: {
        data: { name: dto.name },
        emailRedirectTo: `${this.appUrl}/verificar-correo`,
      },
    });

    if (error || !data.user) {
      if (/already|registered|exists/i.test(error?.message ?? '')) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      throw new InternalServerErrorException(
        `No se pudo crear la cuenta: ${error?.message ?? 'error desconocido'}`,
      );
    }

    try {
      const user = await this.users.createProfile({
        id: data.user.id,
        name: dto.name,
        email,
        phone: dto.phone,
        city: dto.city,
      });

      return {
        user,
        emailVerificationRequired: !data.session,
      };
    } catch (profileError) {
      // Sin perfil, la cuenta de autenticación quedaría huérfana y el correo
      // bloqueado para siempre: se revierte.
      await this.supabaseAdmin.auth.admin.deleteUser(data.user.id);
      throw profileError;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      if (/confirm/i.test(error?.message ?? '')) {
        throw new UnauthorizedException(
          'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
        );
      }
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const user = await this.users.findById(data.user.id);
    if (!user) {
      // Cuenta creada fuera del sistema (por ejemplo, desde el panel de
      // Supabase) que nunca llegó a tener perfil de dominio.
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
   * Renueva la sesión. Supabase rota el refresh token en cada uso y detecta su
   * reutilización, así que la cookie debe reescribirse siempre.
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

  /** Revoca la sesión en Supabase; los errores no impiden cerrarla localmente. */
  async logout(accessToken: string | null): Promise<void> {
    if (!accessToken) return;
    try {
      await this.supabaseAdmin.auth.admin.signOut(accessToken);
    } catch {
      // La cookie se borra igualmente: para la usuaria, la sesión ya terminó.
    }
  }

  /**
   * Envía el correo de recuperación.
   *
   * Responde igual exista o no la cuenta: si dijera "ese correo no está
   * registrado", cualquiera podría averiguar qué clientas tienen cuenta.
   */
  async forgotPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${this.appUrl}/restablecer-clave` },
    );
    if (error) {
      this.logger.warn(`Fallo al enviar recuperación: ${error.message}`);
    }
  }

  /**
   * Cambia la contraseña con el token del correo.
   *
   * Se valida el token de un solo uso con `verifyOtp` y, ya identificada la
   * cuenta, se actualiza la contraseña con la clave de administración.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token_hash: dto.token,
      type: 'recovery',
    });

    if (error || !data.user) {
      throw new UnauthorizedException(
        'El enlace de recuperación no es válido o ya expiró.',
      );
    }

    const { error: updateError } =
      await this.supabaseAdmin.auth.admin.updateUserById(data.user.id, {
        password: dto.password,
      });

    if (updateError) {
      throw new InternalServerErrorException(
        `No se pudo actualizar la contraseña: ${updateError.message}`,
      );
    }

    // Cambiar la contraseña invalida el resto de sesiones abiertas.
    await this.supabaseAdmin.auth.admin.signOut(data.session?.access_token ?? '');
  }

  /** Confirma el correo con el token del enlace enviado al registrarse. */
  async verifyEmail(token: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup',
    });

    if (error) {
      throw new UnauthorizedException(
        'El enlace de confirmación no es válido o ya expiró.',
      );
    }
  }

  /** Reenvía el correo de confirmación a quien no lo recibió. */
  async resendVerification(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${this.appUrl}/verificar-correo` },
    });
    if (error) {
      this.logger.warn(`Fallo al reenviar confirmación: ${error.message}`);
    }
  }
}
