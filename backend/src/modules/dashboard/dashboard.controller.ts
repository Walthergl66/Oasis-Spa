import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import {
  DashboardRangeDto,
  HistoryQueryDto,
  OccupancyQueryDto,
  TopServicesQueryDto,
} from './dto/dashboard-filter.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@ApiTags('Panel Administrativo')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPIs: totales por estado, cancelaciones e ingresos (solo Admin)' })
  async summary(@Query() filter: DashboardRangeDto) {
    return this.dashboardService.getSummary(filter);
  }

  @Get('top-services')
  @ApiOperation({ summary: 'Servicios más solicitados con ingresos (solo Admin)' })
  @ApiResponse({ status: 200 })
  async topServices(@Query() filter: TopServicesQueryDto) {
    return this.dashboardService.getTopServices(filter);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Ocupación por especialista para un día (solo Admin)' })
  async occupancy(@Query() filter: OccupancyQueryDto) {
    return this.dashboardService.getOccupancy(filter.date, filter.employeeId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial filtrable por fecha, empleado o servicio (solo Admin)' })
  async history(@Query() filter: HistoryQueryDto) {
    return this.dashboardService.getHistory(filter);
  }
}
