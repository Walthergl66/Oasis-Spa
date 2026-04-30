import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  MinLength,
} from 'class-validator';

export class DevRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Length(2, 150)
  fullName: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
