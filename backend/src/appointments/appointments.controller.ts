import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentProfile } from '../auth/decorators/current-profile.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/database.enums';
import type { User } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentPublicDto } from './dto/create-appointment-public.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentPublicDto } from './dto/update-appointment-public.dto';
import { AppointmentAccessGuard } from './guards/appointment-access.guard';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create appointment (customer flow)' })
  create(
    @CurrentProfile() profile: User,
    @Body() createAppointmentDto: CreateAppointmentPublicDto,
  ) {
    return this.appointmentsService.createPublic(profile, createAppointmentDto);
  }

  @Post('admin')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create appointment (admin flow)' })
  createAdmin(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.createAdmin(createAppointmentDto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List appointments for current user' })
  findMine(@CurrentProfile() profile: User) {
    return this.appointmentsService.findMine(profile);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, AppointmentAccessGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, AppointmentAccessGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentProfile() profile: User,
    @Body() updateAppointmentDto: UpdateAppointmentPublicDto,
  ) {
    return this.appointmentsService.updatePublic(id, profile, updateAppointmentDto);
  }

  @Patch(':id/admin')
  @UseGuards(SupabaseAuthGuard, RolesGuard, AppointmentAccessGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment (admin flow)' })
  updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, AppointmentAccessGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.remove(id);
  }
}
