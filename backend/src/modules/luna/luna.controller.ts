import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { CreateLunaChatDto } from './dto/create-luna-chat.dto';
import { LunaService } from './luna.service';

/**
 * Chat de Luna.
 *
 * Es público a propósito: una visitante puede consultar servicios y promociones
 * sin cuenta. Las funciones que requieren identidad (`registrarCita`,
 * `consultarMisCitas`, `cancelarCita`) piden inicio de sesión en el propio
 * diálogo cuando `user` viene vacío.
 */
@ApiTags('luna')
@Controller('luna')
export class LunaController {
  constructor(private readonly luna: LunaService) {}

  /** POST /api/luna/chat — envía un mensaje y recibe la respuesta del asistente. */
  @Public()
  @Post('chat')
  @ApiBearerAuth('bearer')
  chat(@Body() dto: CreateLunaChatDto, @CurrentUser() user?: User) {
    return this.luna.chat(user ?? null, dto.sessionId, dto.message);
  }
}
