import { IsEmail, IsString, Length, MinLength } from 'class-validator';

/** Solicitud del correo de recuperación. */
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  email: string;
}

/** Cambio efectivo de contraseña con el token recibido por correo. */
export class ResetPasswordDto {
  @IsString()
  @Length(10, 512, { message: 'El enlace de recuperación no es válido.' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;
}

/** Confirmación de correo con el token del enlace de registro. */
export class VerifyEmailDto {
  @IsString()
  @Length(10, 512, { message: 'El enlace de confirmación no es válido.' })
  token: string;
}
