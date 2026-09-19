import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import { PushSubscriptionEntity } from './entities/push-subscription.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

interface RequestUser {
  id: string;
  role: Role;
}

@ApiTags('Notificaciones Push')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Clave pública VAPID para suscribir la PWA (público)' })
  async getVapidKey(): Promise<{ publicKey: string }> {
    return {
      publicKey: this.configService.get<string>('VAPID_PUBLIC_KEY', ''),
    };
  }

  @Post('subscribe')
  @Roles(Role.CLIENT, Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Suscribir dispositivo PWA a notificaciones push' })
  @ApiResponse({ status: 201, type: PushSubscriptionEntity })
  async subscribe(
    @CurrentUser() user: RequestUser,
    @Body() dto: SubscribePushDto,
  ): Promise<PushSubscriptionEntity> {
    return this.notificationsService.subscribe(user.id, dto);
  }

  @Get('subscriptions/my')
  @Roles(Role.CLIENT, Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Listar mis suscripciones push' })
  async findMine(@CurrentUser() user: RequestUser) {
    return this.notificationsService.findMySubscriptions(user.id);
  }

  @Delete('subscriptions/my')
  @Roles(Role.CLIENT, Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar suscripción push de este dispositivo' })
  async unsubscribe(
    @CurrentUser() user: RequestUser,
    @Query('endpoint') endpoint: string,
  ): Promise<{ message: string }> {
    await this.notificationsService.unsubscribe(user.id, endpoint);
    return { message: 'Suscripción eliminada correctamente' };
  }

  @Get('outbox')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ver últimas notificaciones emitidas (solo Admin)' })
  async outbox() {
    return this.notificationsService.getOutbox();
  }
}
