import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

/**
 * Reseñas de clientas sobre citas completadas.
 *
 * La lectura es pública (la portada muestra testimonios a visitantes); escribir
 * exige sesión y la regla de propiedad se aplica en el servicio: una clienta
 * nunca puede reseñar una cita que no le pertenece.
 */
@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * GET /api/reviews?limit=&serviceId=
   *
   * Lista las reseñas más recientes; `serviceId` filtra por servicio y `limit`
   * acota el resultado (p. ej. para la portada).
   */
  @Public()
  @Get()
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  @ApiQuery({ name: 'serviceId', required: false })
  findAll(
    @Query('limit') limit?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.reviewsService.findAll({
      limit: limit ? Number(limit) : undefined,
      serviceId,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  /** POST /api/reviews — publica una reseña sobre una cita completada propia. */
  @Post()
  @ApiBearerAuth('bearer')
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: User) {
    return this.reviewsService.create(dto, user);
  }
}
