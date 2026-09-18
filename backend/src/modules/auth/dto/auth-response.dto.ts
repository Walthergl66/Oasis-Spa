import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export class TokensDto {
  @ApiProperty({ description: 'JWT Access Token con expiración corta' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token con expiración extendida' })
  refreshToken: string;

  @ApiProperty({ example: 86400, description: 'Segundos de validez del access token' })
  expiresIn: number;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokensDto })
  tokens: TokensDto;
}
