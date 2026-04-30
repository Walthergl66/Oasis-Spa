import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSession } from './entities/chat.entity';
import { User } from '../users/entities/user.entity';
import { ChatOwnershipGuard } from './guards/chat-ownership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage, User]), AuthModule],
  controllers: [ChatController],
  providers: [ChatService, ChatOwnershipGuard],
  exports: [ChatService],
})
export class ChatModule {}
