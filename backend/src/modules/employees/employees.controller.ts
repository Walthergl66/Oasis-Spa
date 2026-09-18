import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { SetScheduleDto } from './dto/set-schedule.dto.js';
import { EmployeeProfile } from './entities/employee.entity.js';
import { EmployeeSchedule } from './entities/employee-schedule.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Empleados y Especialistas')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar especialistas y terapeutas del spa' })
  @ApiResponse({ status: 200, type: [EmployeeProfile] })
  async findAll(@Query('isActive') isActive?: boolean): Promise<EmployeeProfile[]> {
    return this.employeesService.findAll(isActive);
  }

  @Public()
  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Listar empleados capacitados para un servicio específico' })
  @ApiResponse({ status: 200, type: [EmployeeProfile] })
  async findByService(@Param('serviceId') serviceId: string): Promise<EmployeeProfile[]> {
    return this.employeesService.findEmployeesByService(serviceId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Consultar perfil de un terapeuta por ID' })
  @ApiResponse({ status: 200, type: EmployeeProfile })
  async findOne(@Param('id') id: string): Promise<EmployeeProfile> {
    return this.employeesService.findById(id);
  }

  @Public()
  @Get(':id/schedules')
  @ApiOperation({ summary: 'Consultar horarios y turnos de un terapeuta' })
  @ApiResponse({ status: 200, type: [EmployeeSchedule] })
  async getSchedule(@Param('id') id: string): Promise<EmployeeSchedule[]> {
    return this.employeesService.getSchedule(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear perfil de empleado y asociarle servicios (solo Administrador)' })
  @ApiResponse({ status: 201, type: EmployeeProfile })
  async create(@Body() createDto: CreateEmployeeDto): Promise<EmployeeProfile> {
    return this.employeesService.create(createDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar perfil o servicios del empleado (solo Administrador)' })
  @ApiResponse({ status: 200, type: EmployeeProfile })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmployeeDto,
  ): Promise<EmployeeProfile> {
    return this.employeesService.update(id, updateDto);
  }

  @Put(':id/schedules')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Configurar horarios semanales y franjas de descanso (Admin o Empleado)' })
  @ApiResponse({ status: 200, type: [EmployeeSchedule] })
  async setSchedule(
    @Param('id') id: string,
    @Body() scheduleDto: SetScheduleDto,
  ): Promise<EmployeeSchedule[]> {
    return this.employeesService.setSchedule(id, scheduleDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activar o desactivar empleado (solo Administrador)' })
  @ApiResponse({ status: 200, type: EmployeeProfile })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<EmployeeProfile> {
    return this.employeesService.toggleStatus(id, isActive);
  }
}
