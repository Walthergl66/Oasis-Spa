import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export class CreateSpaDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @Matches(TIME_24H_REGEX, {
    message: 'openingTime must use HH:mm or HH:mm:ss format',
  })
  openingTime?: string;

  @IsOptional()
  @Matches(TIME_24H_REGEX, {
    message: 'closingTime must use HH:mm or HH:mm:ss format',
  })
  closingTime?: string;

  @IsUUID()
  ownerId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
