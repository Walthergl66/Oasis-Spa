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
import { UserRole } from '../common/enums/database.enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentProfile } from '../auth/decorators/current-profile.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SpasService } from './spas.service';
import { CreateSpaDto } from './dto/create-spa.dto';
import { UpdateSpaDto } from './dto/update-spa.dto';
import type { User } from '../users/entities/user.entity';
import { SpaOwnershipGuard } from './guards/spa-ownership.guard';

@ApiTags('Spas')
@Controller('spas')
export class SpasController {
  constructor(private readonly spasService: SpasService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  create(@CurrentProfile() profile: User, @Body() createSpaDto: CreateSpaDto) {
    // Avoid trusting client-supplied ownerId
    createSpaDto.ownerId = profile.id;
    return this.spasService.create(createSpaDto);
  }

  @Get()
  findAll() {
    return this.spasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.spasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, SpaOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpaDto: UpdateSpaDto,
  ) {
    // Avoid owner transfer via public API; handle via separate admin workflow if needed
    delete (updateSpaDto as Partial<CreateSpaDto>).ownerId;
    return this.spasService.update(id, updateSpaDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, SpaOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.spasService.remove(id);
  }
}
