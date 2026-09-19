import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations/conversations.service.js';
import { ChatReplyDto, SendMessageDto } from './conversations/dto/chat.dto.js';
import { Conversation } from './conversations/entities/conversation.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

interface RequestUser {
  id: string;
  role: Role;
}

@ApiTags('Asistente Virtual')
@Controller('assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AssistantController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('chat')
  @Roles(Role.CLIENT, Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Conversar con el asistente virtual (historial + LLM)' })
  @ApiResponse({ status: 201, type: ChatReplyDto })
  async chat(
    @CurrentUser() user: RequestUser,
    @Body() dto: SendMessageDto,
  ): Promise<ChatReplyDto> {
    return this.conversationsService.chat(user.id, user.role, dto.conversationId, dto.message);
  }

  @Get('conversations')
  @Roles(Role.CLIENT, Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Listar mis conversaciones con el asistente' })
  @ApiResponse({ status: 200, type: [Conversation] })
  async listMine(@CurrentUser() user: RequestUser): Promise<Conversation[]> {
    return this.conversationsService.listMyConversations(user.id);
  }

  @Get('conversations/:id')
  @Roles(Role.CLIENT, Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Ver historial de una conversación' })
  @ApiResponse({ status: 200, type: Conversation })
  async getOne(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<Conversation> {
    return this.conversationsService.getConversation(user.id, id);
  }
}
