import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { User } from '../users/entities/user.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatSession } from './entities/chat.entity';

@Injectable()
export class ChatService extends BaseCrudService<ChatSession> {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionsRepository: Repository<ChatSession>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super(chatSessionsRepository, 'Chat session');
  }

  async create(createChatDto: CreateChatDto) {
    await this.ensureExists(this.usersRepository, createChatDto.userId, 'User');
    return super.create(createChatDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['user', 'messages'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['user', 'messages'],
    });
  }

  async findMine(profile: User) {
    return super.findAll({
      where: { userId: profile.id } as any,
      relations: ['messages'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateChatDto: UpdateChatDto) {
    if (updateChatDto.userId) {
      await this.ensureExists(this.usersRepository, updateChatDto.userId, 'User');
    }

    return super.update(id, updateChatDto);
  }
}
