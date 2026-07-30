import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

/**
 * Alta de una clienta. El rol no se acepta desde el cliente a propósito:
 * siempre se registra como `cliente`. Las cuentas de personal y administración
 * las crea el panel administrativo.
 */
export class RegisterDto {
  @IsString()
  @Length(3, 120, { message: 'El nombre debe tener entre 3 y 120 caracteres.' })
  name: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  city?: string;
}
