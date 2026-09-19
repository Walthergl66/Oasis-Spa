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
import { ServicesService } from '../../services/services.service.js';
import { AssistantToolsService } from '../tools/assistant-tools.service.js';
import type { ToolContext, ToolResult } from '../tools/tool-definition.interface.js';
import { Role } from '../../../common/enums/role.enum.js';
import {
  detectConfirmation,
  detectDenial,
  detectToolIntent,
  extractAllDates,
  extractDate,
  extractTime,
  resolveService,
} from '../tools/intent-parser.js';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @Inject(LLM_PROVIDER_TOKEN)
    private readonly llm: LlmProvider,
    private readonly servicesService: ServicesService,
    private readonly tools: AssistantToolsService,
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
    role: Role,
    conversationId: string | undefined,
    rawMessage: string,
  ): Promise<{ conversationId: string; reply: string }> {
    const clean = sanitizeUserMessage(rawMessage);
    if (!clean) {
      throw new ForbiddenException('El mensaje no puede estar vacío');
    }

    const conversation = await this.resolveConversation(userId, conversationId, clean);
    await this.saveMessage(conversation.id, ChatRole.USER, clean);

    const ctx: ToolContext = { userId, role };
    const toolReply = await this.tryToolLoop(ctx, clean);
    const reply =
      toolReply ?? (await this.plainLlmReply(conversation.id));

    await this.saveMessage(conversation.id, ChatRole.ASSISTANT, reply);

    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    return { conversationId: conversation.id, reply };
  }

  /**
   * Bucle de ejecución segura (RF-20): primero propuestas pendientes,
   * luego enrutado por intención a las tools del backend. Devuelve null
   * cuando faltan datos y el LLM debe pedir aclaraciones conversando.
   * Las respuestas de tools se devuelven verbatim: son plantillas
   * deterministas en español con datos reales, sin riesgo de que el
   * modelo altere horarios, precios o estados.
   */
  private async tryToolLoop(ctx: ToolContext, clean: string): Promise<string | null> {
    const pending = this.tools.getPending(ctx.userId);
    if (pending) {
      if (detectDenial(clean)) {
        this.tools.clearPending(ctx.userId);
        return 'Entendido, descarté la propuesta. ¿Te ayudo en algo más?';
      }
      if (detectConfirmation(clean)) {
        const result = await this.tools.confirmPending(ctx);
        return this.resultText(result);
      }
      this.tools.clearPending(ctx.userId);
    }

    const intent = detectToolIntent(clean);
    if (!intent) return null;

    switch (intent) {
      case 'list_services': {
        const result = await this.tools.execute('listarServicios', {}, ctx);
        return this.resultText(result);
      }
      case 'my_appointments': {
        const result = await this.tools.execute('misCitas', {}, ctx);
        return this.resultText(result);
      }
      case 'check_availability': {
        const services = await this.safeCatalog();
        const service = resolveService(services, clean);
        const date = extractDate(clean);
        if (!service || !date) return null;
        const result = await this.tools.execute(
          'consultarDisponibilidad',
          { serviceId: service.id, fecha: date },
          ctx,
        );
        return this.resultText(result);
      }
      case 'book': {
        const services = await this.safeCatalog();
        const service = resolveService(services, clean);
        const date = extractDate(clean);
        const time = extractTime(clean);
        if (!service || !date || !time) return null;
        const result = await this.tools.execute(
          'registrarCita',
          {
            serviceId: service.id,
            fecha: date,
            hora: time,
            confirmado: detectConfirmation(clean),
          },
          ctx,
        );
        return this.resultText(result);
      }
      case 'cancel': {
        const dates = extractAllDates(clean);
        const result = await this.tools.execute(
          'cancelarCita',
          { fecha: dates[0], confirmado: detectConfirmation(clean) },
          ctx,
        );
        return this.resultText(result);
      }
      case 'reschedule': {
        const dates = extractAllDates(clean);
        const time = extractTime(clean);
        if (dates.length === 0 || !time) return null;
        const result = await this.tools.execute(
          'modificarCita',
          {
            fecha: dates.length > 1 ? dates[0] : undefined,
            nuevaFecha: dates.length > 1 ? dates[dates.length - 1] : dates[0],
            nuevaHora: time,
            confirmado: detectConfirmation(clean),
          },
          ctx,
        );
        return this.resultText(result);
      }
      default:
        return null;
    }
  }

  private resultText(result: ToolResult): string {
    return result.ok ? result.summary : result.error;
  }

  private async safeCatalog(): Promise<Array<{ id: string; name: string }>> {
    try {
      return await this.servicesService.findAllActive();
    } catch {
      return [];
    }
  }

  private async plainLlmReply(conversationId: string): Promise<string> {
    const history = await this.messageRepository.find({
      where: { conversationId },
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

    return (await this.llm.generateReply(llmMessages)).trim();
  }

  private async resolveConversation(
    userId: string,
    conversationId: string | undefined,
    clean: string,
  ): Promise<Conversation> {
    if (conversationId) {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
      });
      if (!conversation) {
        throw new NotFoundException(`Conversación ${conversationId} no encontrada`);
      }
      if (conversation.userId !== userId) {
        throw new ForbiddenException('No tiene acceso a esta conversación');
      }
      return conversation;
    }
    return this.conversationRepository.save(
      this.conversationRepository.create({
        userId,
        title: clean.slice(0, 80),
      }),
    );
  }

  private async saveMessage(
    conversationId: string,
    role: ChatRole,
    content: string,
  ): Promise<void> {
    await this.messageRepository.save(
      this.messageRepository.create({ conversationId, role, content }),
    );
  }
}
