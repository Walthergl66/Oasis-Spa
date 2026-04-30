import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  spaId: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  specialty?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: false })
  commissionPercentage?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
