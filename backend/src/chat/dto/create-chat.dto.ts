import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateChatDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  sessionToken?: string;
}
