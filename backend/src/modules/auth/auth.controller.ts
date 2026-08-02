import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
// `import type` es obligatorio para los tipos que aparecen en firmas
// decoradas: con `isolatedModules` + `emitDecoratorMetadata`, TypeScript no
// puede emitir metadatos de un tipo que quizá no exista en tiempo de ejecución.
import type { Response } from 'express';
import { User } from '../users/entities/user.entity';
import { AuthService, type AuthResult } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/reset-password.dto';
import type { AuthenticatedRequest } from './types/authenticated-request';

/** Lo que viaja al navegador. El refresh token nunca aparece aquí. */
interface SessionResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get cookieName(): string {
    return this.config.get<string>('REFRESH_COOKIE_NAME', 'oasis_rt');
  }

  /**
   * Fija el refresh token en una cookie httpOnly.
   *
   * `sameSite: 'lax'` basta mientras la API y la aplicación compartan sitio
   * (localhost en desarrollo, subdominios del mismo dominio en producción). Si
   * se despliegan en dominios distintos habrá que pasar a `sameSite: 'none'`
   * con `secure: true`.
   */
  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(this.cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(this.cookieName, { path: '/api/auth' });
  }

  private toSession(result: AuthResult, response: Response): SessionResponse {
    this.setRefreshCookie(response, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * POST /api/auth/register
   *
   * No devuelve sesión: la clienta debe confirmar su correo antes de entrar.
   */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    return this.toSession(await this.auth.login(dto), response);
  }

  /** Renueva el access token usando la cookie; no requiere sesión vigente. */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    const token = (request.cookies as Record<string, string> | undefined)?.[
      this.cookieName
    ];
    if (!token) throw new UnauthorizedException('No hay sesión que renovar.');

    try {
      return this.toSession(await this.auth.refresh(token), response);
    } catch (error) {
      this.clearRefreshCookie(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const header = request.headers.authorization;
    const accessToken = header?.toLowerCase().startsWith('bearer ')
      ? header.slice(7)
      : null;

    await this.auth.logout(accessToken);
    this.clearRefreshCookie(response);
  }

  /**
   * POST /api/auth/forgot-password
   *
   * Responde 204 exista o no la cuenta: revelar cuáles están registradas
   * permitiría enumerar la base de clientas.
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.auth.forgotPassword(dto.email);
  }

  /** POST /api/auth/reset-password — con el token del correo. */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto);
  }

  /** POST /api/auth/verify-email — confirma la cuenta recién registrada. */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.auth.verifyEmail(dto.token);
  }

  /** POST /api/auth/resend-verification — para quien no recibió el correo. */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendVerification(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.auth.resendVerification(dto.email);
  }

  /** Perfil de la sesión actual: lo usa el frontend al recargar la página. */
  @Get('me')
  @ApiBearerAuth('bearer')
  me(@CurrentUser() user: User): User {
    return user;
  }
}
