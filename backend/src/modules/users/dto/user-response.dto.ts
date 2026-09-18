import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum.js';
import { User } from '../entities/user.entity.js';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'cliente@oasisspa.com' })
  email: string;

  @ApiProperty({ example: 'María' })
  firstName: string;

  @ApiProperty({ example: 'Gómez' })
  lastName: string;

  @ApiPropertyOptional({ example: '+593987654321' })
  phone?: string | null;

  @ApiProperty({ enum: Role, example: Role.CLIENT })
  role: Role;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
