import {
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsUUID()
  spaId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  @Length(2, 150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString({ no_symbols: false })
  price: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
