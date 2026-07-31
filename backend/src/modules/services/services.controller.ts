import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

/**
 * Catálogo de servicios.
 *
 * Leer es público: la clienta debe poder ver la oferta antes de crearse una
 * cuenta. Escribir exige rol de administración — la comprobación vive en el
 * backend, no en la interfaz.
 */
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * GET /api/services?category=Uñas
   *
   * Devuelve únicamente el catálogo activo. Los servicios retirados no se
   * exponen aquí bajo ninguna circunstancia: para verlos existe una ruta
   * aparte con rol, en lugar de un parámetro que cualquiera podría añadir.
   */
  @Public()
  @Get()
  findAll(@Query('category') category?: string) {
    return this.servicesService.findAll({ category });
  }

  /**
   * GET /api/services/manage
   *
   * Catálogo completo, incluidos los servicios desactivados. Se declara antes
   * que `:id` para que el enrutador no lo interprete como un identificador.
   */
  @Get('manage')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.servicesService.findAll({ includeInactive: true });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }
}
