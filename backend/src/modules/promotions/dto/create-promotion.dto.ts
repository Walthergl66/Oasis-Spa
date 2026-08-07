import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PromotionColor } from '../entities/promotion.entity';

/**
 * Promoción comercial.
 *
 * `serviceIds` es la relación muchos a muchos con el catálogo: la lista de
 * servicios que la promoción cubre. `startsAt`/`endsAt` (ISO) habilitan el
 * filtrado de vigencia por fechas además del booleano `active`.
 */
export class CreatePromotionDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Etiqueta visible: "-30%", "2x1". */
  @IsOptional()
  @IsString()
  @MaxLength(12)
  badge?: string;

  @IsOptional()
  @IsEnum(PromotionColor)
  color?: PromotionColor;

  /** Texto de vigencia mostrado a la clienta: "Todos los martes". */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  validText?: string;

  @IsArray()
  @IsUUID('4', { each: true, message: 'Los servicios indicados no son válidos.' })
  @ArrayMinSize(1, { message: 'La promoción debe cubrir al menos un servicio.' })
  serviceIds: string[];

  @IsOptional()
  @IsNumber()
  priceBefore?: number;

  @IsOptional()
  @IsNumber()
  priceNow?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** Fechas de vigencia en ISO 8601. */
  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}
