import { Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';

/**
 * Avisos de la usuaria autenticada.
 *
 * No hay endpoint para consultar los avisos de otra persona: el destinatario
 * sale siempre del token, nunca de un parámetro. Así no existe forma de pedir
 * notificaciones ajenas cambiando un id en la URL.
 */
@ApiTags('notifications')
@ApiBearerAuth('bearer')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/notifications — los avisos de quien hace la petición. */
  @Get()
  findMine(@CurrentUser() user: User) {
    return this.notificationsService.findForUser(user.id);
  }

  /** PATCH /api/notifications/read-all — marca todos como leídos. */
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() user: User): Promise<void> {
    await this.notificationsService.markAllRead(user.id);
  }
}
