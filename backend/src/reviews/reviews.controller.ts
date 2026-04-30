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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentProfile } from '../auth/decorators/current-profile.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/database.enums';
import type { User } from '../users/entities/user.entity';
import { ReviewsService } from './reviews.service';
import { CreateReviewPublicDto } from './dto/create-review-public.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewOwnershipGuard } from './guards/review-ownership.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  create(
    @CurrentProfile() profile: User,
    @Body() createReviewDto: CreateReviewPublicDto,
  ) {
    return this.reviewsService.createPublic(profile, createReviewDto);
  }

  @Post('admin')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  createAdmin(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  findMine(@CurrentProfile() profile: User) {
    return this.reviewsService.findMine(profile);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, ReviewOwnershipGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, ReviewOwnershipGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    // Avoid tampering with ownership pointers via public API
    delete (updateReviewDto as any).customerId;
    delete (updateReviewDto as any).spaId;
    delete (updateReviewDto as any).appointmentId;
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, ReviewOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.remove(id);
  }
}
