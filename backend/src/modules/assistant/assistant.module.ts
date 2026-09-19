import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from './llm/llm.module.js';
import { Conversation } from './conversations/entities/conversation.entity.js';
import { ChatMessage } from './conversations/entities/chat-message.entity.js';
import { ConversationsService } from './conversations/conversations.service.js';
import { AssistantController } from './assistant.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, ChatMessage]), LlmModule],
  controllers: [AssistantController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class AssistantModule {}
