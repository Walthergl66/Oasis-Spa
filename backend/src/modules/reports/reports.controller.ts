import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SpecialistLoadQueryDto } from './dto/specialist-load-query.dto';
import { ReportsService } from './reports.service';

/**
 * Reportes del panel administrativo.
 *
 * Todo el módulo es exclusivo del personal: son datos agregados del negocio
 * —ingresos, ocupación, cancelaciones— que ninguna clienta debe ver.
 */
@ApiTags('reports')
@ApiBearerAuth('bearer')
@Roles(UserRole.ADMIN, UserRole.ESPECIALISTA)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** GET /api/reports/dashboard — indicadores, ingresos y rankings. */
  @Get('dashboard')
  getDashboard() {
    return this.reports.getDashboard();
  }

  /** GET /api/reports/specialists?date= — carga del equipo ese día. */
  @Get('specialists')
  @ApiQuery({ name: 'date', required: false, example: '2026-08-04' })
  getSpecialistLoad(@Query() query: SpecialistLoadQueryDto) {
    const fecha =
      query.date ??
      new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
    return this.reports.getSpecialistLoad(fecha);
  }
}
