import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { PaymentFilterDto, RegisterPaymentDto } from './dto/payment.dto.js';
import { Payment } from './entities/payment.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

interface RequestUser {
  id: string;
  role: Role;
}

@ApiTags('Anticipos y Pagos')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Registrar anticipo de una cita (Admin o Empleado)' })
  @ApiResponse({ status: 201, type: Payment })
  async register(
    @CurrentUser() user: RequestUser,
    @Body() dto: RegisterPaymentDto,
  ): Promise<Payment> {
    return this.paymentsService.register(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar anticipos con filtros (solo Admin)' })
  async findAll(@Query() filter: PaymentFilterDto): Promise<Payment[]> {
    return this.paymentsService.findAll(filter);
  }

  @Get('appointment/:appointmentId')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Anticipos de una cita (Admin o Empleado)' })
  async findByAppointment(@Param('appointmentId') appointmentId: string): Promise<Payment[]> {
    return this.paymentsService.findByAppointment(appointmentId);
  }

  @Patch(':id/annul')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Anular anticipo para correcciones (solo Admin)' })
  async annul(@Param('id') id: string): Promise<Payment> {
    return this.paymentsService.annul(id);
  }
}
