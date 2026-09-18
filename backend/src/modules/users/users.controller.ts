import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateProfile(userId, updateDto);
    return UserResponseDto.fromEntity(updated);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios (solo Admin)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@Query('role') role?: Role): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll(role);
    return users.map((u) => UserResponseDto.fromEntity(u));
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener usuario por ID (solo Admin)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cambiar rol de un usuario (solo Admin)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: Role,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateRole(id, role);
    return UserResponseDto.fromEntity(updated);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar o desactivar un usuario (solo Admin)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.toggleActive(id, isActive);
    return UserResponseDto.fromEntity(updated);
  }
}
