import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Publicación de una reseña.
 *
 * La cita se identifica con `appointmentId`; la clienta y el servicio salen de
 * la propia cita, nunca del cuerpo: así no se puede reseñar el servicio de una
 * cita ajena cambiando un id.
 */
export class CreateReviewDto {
  @IsUUID('4', { message: 'La cita indicada no es válida.' })
  appointmentId: string;

  @IsInt({ message: 'La valoración debe ser un número entero.' })
  @Min(1, { message: 'La valoración debe estar entre 1 y 5.' })
  @Max(5, { message: 'La valoración debe estar entre 1 y 5.' })
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'El comentario no puede superar los 1000 caracteres.',
  })
  text?: string;
}
