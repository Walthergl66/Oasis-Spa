import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

/**
 * Mensaje para Luna.
 *
 * `sessionId` identifica la sesión del chat cuando la clienta no ha iniciado
 * sesión; con sesión iniciada el estado se clavea por la usuaria y se ignora.
 */
export class CreateLunaChatDto {
  @IsString({ message: 'El mensaje no es válido.' })
  @Length(1, 1000, {
    message: 'El mensaje debe tener entre 1 y 1000 caracteres.',
  })
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(64, { message: 'El identificador de sesión no es válido.' })
  sessionId?: string;
}
