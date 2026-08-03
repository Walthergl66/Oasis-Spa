import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  CancelAppointmentDto,
  RescheduleAppointmentDto,
  UpdateStatusDto,
} from './dto/update-appointment.dto';

/**
 * Citas del spa.
 *
 * Regla transversal: la clienta nunca indica de quién es la cita. El
 * destinatario sale del token, y `comprobarPropiedad` impide tocar citas
 * ajenas cambiando un id en la URL.
 */
@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  /**
   * GET /api/appointments/availability?serviceId=&date=
   *
   * Horarios libres de un servicio en una fecha. Es pública a propósito: una
   * visitante puede ver si hay hueco antes de decidirse a crear una cuenta.
   */
  @Public()
  @Get('availability')
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-15' })
  getAvailability(
    @Query('serviceId', ParseUUIDPipe) serviceId: string,
    @Query('date') date: string,
  ) {
    return this.appointments.getAvailability(serviceId, date);
  }

  /** GET /api/appointments/mine — próximas citas de quien pregunta. */
  @Get('mine')
  @ApiBearerAuth('bearer')
  @ApiQuery({ name: 'scope', required: false, enum: ['upcoming', 'history'] })
  findMine(
    @CurrentUser() user: User,
    @Query('scope') scope?: 'upcoming' | 'history',
  ) {
    return this.appointments.findForClient(
      user.id,
      scope === 'history' ? 'history' : 'upcoming',
    );
  }

  /** GET /api/appointments/agenda?date= — agenda del día (panel). */
  @Get('agenda')
  @ApiBearerAuth('bearer')
  @Roles(UserRole.ADMIN, UserRole.ESPECIALISTA)
  @ApiQuery({ name: 'date', required: true, example: '2026-08-15' })
  getAgenda(@Query('date') date: string) {
    return this.appointments.getAgenda(date);
  }

  @Get(':id')
  @ApiBearerAuth('bearer')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.appointments.findOne(id, user);
  }

  /** POST /api/appointments — reserva una cita. */
  @Post()
  @ApiBearerAuth('bearer')
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: User) {
    return this.appointments.create(dto, user);
  }

  /** PATCH /api/appointments/:id/reschedule — cambia fecha y hora. */
  @Patch(':id/reschedule')
  @ApiBearerAuth('bearer')
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: User,
  ) {
    return this.appointments.reschedule(id, dto, user);
  }

  /** PATCH /api/appointments/:id/cancel — libera la franja. */
  @Patch(':id/cancel')
  @ApiBearerAuth('bearer')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser() user: User,
  ) {
    return this.appointments.cancel(id, dto.reason, user);
  }

  /**
   * PATCH /api/appointments/:id/status — confirmar o completar.
   *
   * Al completar se acreditan los puntos de fidelidad de la clienta, así que
   * queda restringido al personal.
   */
  @Patch(':id/status')
  @ApiBearerAuth('bearer')
  @Roles(UserRole.ADMIN, UserRole.ESPECIALISTA)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appointments.updateStatus(id, dto);
  }
}
