import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SpecialistsService } from './specialists.service';

/**
 * Equipo del spa.
 *
 * La lista es pública: la clienta ve quién la atenderá antes de reservar. La
 * gestión (altas, bajas, cambios de estado) llega con el panel administrativo.
 */
@ApiTags('specialists')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  /** GET /api/specialists — equipo activo. */
  @Public()
  @Get()
  findAll() {
    return this.specialistsService.findAll();
  }

  /** GET /api/specialists/manage — incluye a las dadas de baja. */
  @Get('manage')
  @ApiBearerAuth('bearer')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.specialistsService.findAll(true);
  }
}
