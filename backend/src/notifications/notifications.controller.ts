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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationOwnershipGuard } from './guards/notification-ownership.guard';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  create(
    @CurrentProfile() profile: User,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    // Do not trust client-provided userId unless privileged
    if (profile.role !== UserRole.ADMIN && profile.role !== UserRole.SUPER_ADMIN) {
      createNotificationDto.userId = profile.id;
    }
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  findMine(@CurrentProfile() profile: User) {
    return this.notificationsService.findMine(profile);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, NotificationOwnershipGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, NotificationOwnershipGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    // Avoid reassignment via public API
    delete (updateNotificationDto as any).userId;
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard, NotificationOwnershipGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id);
  }
}
