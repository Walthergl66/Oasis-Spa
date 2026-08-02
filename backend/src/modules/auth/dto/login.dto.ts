import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Credenciales de acceso.
 *
 * A diferencia del registro, aquí NO se valida la longitud de la contraseña.
 * Hacerlo daría un 400 para claves cortas y un 401 para claves incorrectas, y
 * esa diferencia permite deducir la política de contraseñas del sistema. Toda
 * credencial inválida debe responder igual: 401.
 */
export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password: string;
}
