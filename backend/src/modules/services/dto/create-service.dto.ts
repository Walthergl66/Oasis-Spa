import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

/**
 * Alta de un servicio del catálogo.
 *
 * `category` viaja como NOMBRE, no como uuid, porque es lo que maneja la
 * interfaz y lo que entiende una persona que administra el spa. El servicio se
 * encarga de resolverlo contra la tabla de categorías.
 *
 * `rating` y `reviewsCount` no se aceptan: son resultado de las reseñas, no
 * datos que alguien pueda escribir a mano.
 */
export class CreateServiceDto {
  @IsString()
  @Length(3, 120, { message: 'El nombre debe tener entre 3 y 120 caracteres.' })
  name: string;

  @IsString()
  @Length(2, 60)
  category: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsInt()
  @Min(15, { message: 'La duración mínima es de 15 minutos.' })
  @Max(600, { message: 'La duración máxima es de 10 horas.' })
  durationMin: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  price: number;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  image?: string;

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
