import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';

/**
 * Promociones comerciales.
 *
 * La lectura es pública (la portada y Luna las muestran a visitantes); la
 * gestión queda restringida al panel administrativo.
 */
@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /** GET /api/promotions?includeInactive= — por defecto sólo las vigentes. */
  @Public()
  @Get()
  @ApiQuery({ name: 'includeInactive', required: false })
  findAll(@Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive = false) {
    return this.promotionsService.findAll(includeInactive);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.findOne(id);
  }

  /** POST /api/promotions (admin) */
  @Post()
  @ApiBearerAuth('bearer')
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  /** PATCH /api/promotions/:id (admin) — también activa/desactiva. */
  @Patch(':id')
  @ApiBearerAuth('bearer')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('bearer')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.remove(id);
  }
}
