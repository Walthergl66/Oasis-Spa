import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity.js';
import { ChatMessage, ChatRole } from './entities/chat-message.entity.js';
import {
  ASSISTANT_SYSTEM_PROMPT,
  HISTORY_WINDOW,
  sanitizeUserMessage,
} from './assistant-prompts.js';
import {
  LLM_PROVIDER_TOKEN,
  type LlmChatMessage,
  type LlmProvider,
} from '../llm/llm-provider.interface.js';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @Inject(LLM_PROVIDER_TOKEN)
    private readonly llm: LlmProvider,
  ) {}

  async listMyConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 30,
    });
  }

  async getConversation(userId: string, id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: { messages: true },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversación ${id} no encontrada`);
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException('No tiene acceso a esta conversación');
    }
    conversation.messages = (conversation.messages ?? []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return conversation;
  }

  async chat(
    userId: string,
    conversationId: string | undefined,
    rawMessage: string,
  ): Promise<{ conversationId: string; reply: string }> {
    const clean = sanitizeUserMessage(rawMessage);
    if (!clean) {
      throw new ForbiddenException('El mensaje no puede estar vacío');
    }

    let conversation: Conversation | null = null;
    if (conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
      });
      if (!conversation) {
        throw new NotFoundException(`Conversación ${conversationId} no encontrada`);
      }
      if (conversation.userId !== userId) {
        throw new ForbiddenException('No tiene acceso a esta conversación');
      }
    } else {
      conversation = await this.conversationRepository.save(
        this.conversationRepository.create({
          userId,
          title: clean.slice(0, 80),
        }),
      );
    }

    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId: conversation.id,
        role: ChatRole.USER,
        content: clean,
      }),
    );

    const history = await this.messageRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
      take: HISTORY_WINDOW,
    });

    const llmMessages: LlmChatMessage[] = [
      { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: (m.role === ChatRole.ASSISTANT ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
    ];

    const reply = (await this.llm.generateReply(llmMessages)).trim();

    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId: conversation.id,
        role: ChatRole.ASSISTANT,
        content: reply,
      }),
    );

    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    return { conversationId: conversation.id, reply };
  }
}
