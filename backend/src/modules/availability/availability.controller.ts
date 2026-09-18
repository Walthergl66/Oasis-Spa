import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service.js';
import { GetAvailabilityDto } from './dto/get-availability.dto.js';
import { AvailabilityResponseDto } from './dto/availability-response.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Disponibilidad de Horarios')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Consultar espacios libres para un servicio en una fecha (calculado dinámicamente)',
  })
  @ApiResponse({ status: 200, type: AvailabilityResponseDto })
  async getAvailability(
    @Query() query: GetAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.getAvailableSlots(query);
  }
}
