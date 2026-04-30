import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/database.enums';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { ChatSession } from '../entities/chat.entity';

@Injectable()
export class ChatOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionsRepository: Repository<ChatSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const profile = request.profile;

    if (!profile) throw new ForbiddenException('Authorization context is missing');
    if (profile.role === UserRole.SUPER_ADMIN || profile.role === UserRole.ADMIN) {
      return true;
    }

    const chatId = request.params?.id as string | undefined;
    if (!chatId) throw new ForbiddenException('Chat id is required');

    const session = await this.chatSessionsRepository.findOne({
      where: { id: chatId },
      select: { id: true, userId: true },
    });
    if (!session) throw new ForbiddenException('Chat session not found');

    if (session.userId !== profile.id) {
      throw new ForbiddenException('You can only access your own chat sessions');
    }

    return true;
  }
}

