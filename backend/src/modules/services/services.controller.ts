import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { ServiceFilterDto } from './dto/service-filter.dto.js';
import { ServiceEntity } from './entities/service.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Servicios')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo de servicios (público con filtros por categoría o estado)' })
  @ApiResponse({ status: 200, type: [ServiceEntity] })
  async findAll(@Query() filter: ServiceFilterDto): Promise<ServiceEntity[]> {
    return this.servicesService.findAll(filter);
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Catálogo público de servicios activos' })
  @ApiResponse({ status: 200, type: [ServiceEntity] })
  async findAllActive(@Query('category') category?: string): Promise<ServiceEntity[]> {
    return this.servicesService.findAllActive(category);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de un servicio por ID' })
  @ApiResponse({ status: 200, type: ServiceEntity })
  async findOne(@Param('id') id: string): Promise<ServiceEntity> {
    return this.servicesService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nuevo servicio de spa (solo Administrador)' })
  @ApiResponse({ status: 201, type: ServiceEntity })
  async create(@Body() createDto: CreateServiceDto): Promise<ServiceEntity> {
    return this.servicesService.create(createDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar datos de un servicio (solo Administrador)' })
  @ApiResponse({ status: 200, type: ServiceEntity })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    return this.servicesService.update(id, updateDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activar o desactivar servicio (solo Administrador)' })
  @ApiResponse({ status: 200, type: ServiceEntity })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<ServiceEntity> {
    return this.servicesService.toggleStatus(id, isActive);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar servicio permanentemente (solo Administrador)' })
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
