import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

/**
 * Endpoints de usuarios.
 *
 * De momento sólo la consulta puntual que necesita el panel; el perfil editable
 * y la base de clientas se implementan junto con el resto del módulo. Todo lo
 * que hay aquí exige sesión: el guard de autenticación es global.
 */
@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ESPECIALISTA)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }
}
