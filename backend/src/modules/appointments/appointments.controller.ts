import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto.js';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto.js';
import { AppointmentFilterDto } from './dto/appointment-filter.dto.js';
import { Appointment } from './entities/appointment.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

interface RequestUser {
  id: string;
  email: string;
  role: Role;
}

@ApiTags('Citas y Reservas')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.CLIENT, Role.ADMIN)
  @ApiOperation({ summary: 'Reservar una cita (cliente autenticado)' })
  @ApiResponse({ status: 201, type: Appointment })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentsService.createAppointment(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todas las citas con filtros (solo Administrador)' })
  @ApiResponse({ status: 200, type: [Appointment] })
  async findAll(@Query() filter: AppointmentFilterDto): Promise<Appointment[]> {
    return this.appointmentsService.findAll(filter);
  }

  @Get('my')
  @Roles(Role.CLIENT, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Consultar mis citas como cliente' })
  @ApiResponse({ status: 200, type: [Appointment] })
  async findMy(@CurrentUser() user: RequestUser): Promise<Appointment[]> {
    return this.appointmentsService.findByClient(user.id);
  }

  @Get('employee/:employeeId')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Consultar agenda de un especialista (Admin o Empleado)' })
  @ApiResponse({ status: 200, type: [Appointment] })
  async findByEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<Appointment[]> {
    return this.appointmentsService.findByEmployee(employeeId);
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Consultar detalle de una cita por ID' })
  @ApiResponse({ status: 200, type: Appointment })
  async findOne(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentsService.findById(id);
    if (user.role === Role.CLIENT && appointment.clientId !== user.id) {
      throw new ForbiddenException('No tiene permiso para ver esta cita');
    }
    return appointment;
  }

  @Patch(':id/confirm')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Confirmar una cita pendiente (Admin o Empleado)' })
  @ApiResponse({ status: 200, type: Appointment })
  async confirm(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentsService.confirmAppointment(id);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Marcar cita como completada (Admin o Empleado)' })
  @ApiResponse({ status: 200, type: Appointment })
  async complete(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentsService.completeAppointment(id);
  }

  @Patch(':id/no-show')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Marcar inasistencia del cliente (Admin o Empleado)' })
  @ApiResponse({ status: 200, type: Appointment })
  async markNoShow(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentsService.markNoShow(id);
  }

  @Patch(':id/cancel')
  @Roles(Role.CLIENT, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Cancelar cita (margen mínimo 2h, salvo Admin)' })
  @ApiResponse({ status: 200, type: Appointment })
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<Appointment> {
    if (user.role === Role.CLIENT) {
      const appointment = await this.appointmentsService.findById(id);
      if (appointment.clientId !== user.id) {
        throw new ForbiddenException('No puede cancelar citas de otros clientes');
      }
    }
    return this.appointmentsService.cancelAppointment(
      id,
      user.id,
      user.role,
      dto,
    );
  }

  @Patch(':id/reschedule')
  @Roles(Role.CLIENT, Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Reprogramar cita a un nuevo horario (margen mínimo 2h)' })
  @ApiResponse({ status: 200, type: Appointment })
  async reschedule(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    if (user.role === Role.CLIENT) {
      const appointment = await this.appointmentsService.findById(id);
      if (appointment.clientId !== user.id) {
        throw new ForbiddenException('No puede reprogramar citas de otros clientes');
      }
    }
    return this.appointmentsService.rescheduleAppointment(
      id,
      user.id,
      user.role,
      dto,
    );
  }
}
