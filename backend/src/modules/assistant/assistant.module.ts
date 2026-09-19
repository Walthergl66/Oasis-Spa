import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from './llm/llm.module.js';
import { Conversation } from './conversations/entities/conversation.entity.js';
import { ChatMessage } from './conversations/entities/chat-message.entity.js';
import { ConversationsService } from './conversations/conversations.service.js';
import { AssistantToolsService } from './tools/assistant-tools.service.js';
import { AssistantController } from './assistant.controller.js';
import { ServicesModule } from '../services/services.module.js';
import { AvailabilityModule } from '../availability/availability.module.js';
import { AppointmentsModule } from '../appointments/appointments.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ChatMessage]),
    LlmModule,
    ServicesModule,
    AvailabilityModule,
    AppointmentsModule,
  ],
  controllers: [AssistantController],
  providers: [ConversationsService, AssistantToolsService],
  exports: [ConversationsService, AssistantToolsService],
})
export class AssistantModule {}
