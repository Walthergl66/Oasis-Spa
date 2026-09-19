import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationsService } from './conversations.service.js';
import { sanitizeUserMessage } from './assistant-prompts.js';
import { MockLlmProvider } from '../llm/mock-llm.provider.js';

describe('sanitizeUserMessage (RF-22)', () => {
  it('remueve HTML y colapsa espacios', () => {
    expect(sanitizeUserMessage('<b>Hola</b>   mundo')).toBe('Hola mundo');
  });

  it('recorta a 2000 caracteres', () => {
    expect(sanitizeUserMessage('a'.repeat(2500))).toHaveLength(2000);
  });

  it('vacío tras sanear queda vacío', () => {
    expect(sanitizeUserMessage('<p>   </p>')).toBe('');
  });
});

describe('MockLlmProvider', () => {
  it('responde saludo, catálogo y reserva sin inventar horarios', async () => {
    const llm = new MockLlmProvider();
    const greeting = await llm.generateReply([{ role: 'user', content: 'Hola' }]);
    expect(greeting).toContain('Oasis Spa');
    const catalog = await llm.generateReply([{ role: 'user', content: '¿Qué servicios y precios tienen?' }]);
    expect(catalog).toContain('catálogo');
    const booking = await llm.generateReply([{ role: 'user', content: 'Quiero reservar una cita mañana' }]);
    expect(booking).toContain('servicio');
  });
});

describe('ConversationsService (Sprint 5: historial + LLM)', () => {
  let service: ConversationsService;
  let mockConvRepo: any;
  let mockMsgRepo: any;
  let savedMessages: any[];

  beforeEach(() => {
    savedMessages = [];
    mockConvRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      create: vi.fn((dto: any) => ({ id: 'conv-1', ...dto })),
      save: vi.fn(async (e: any) => e),
    };
    mockMsgRepo = {
      find: vi.fn().mockResolvedValue([]),
      create: vi.fn((dto: any) => ({ id: `msg-${savedMessages.length}`, ...dto })),
      save: vi.fn(async (e: any) => {
        savedMessages.push(e);
        return e;
      }),
    };
    service = new ConversationsService(mockConvRepo, mockMsgRepo, new MockLlmProvider());
  });

  it('crea conversación nueva y persiste turno user + assistant', async () => {
    const result = await service.chat('user-1', undefined, 'Hola, <b>quiero info</b>');
    expect(result.conversationId).toBe('conv-1');
    expect(result.reply.length).toBeGreaterThan(10);
    expect(savedMessages).toHaveLength(2);
    expect(savedMessages[0].content).toBe('Hola, quiero info');
    expect(savedMessages[0].role).toBe('user');
    expect(savedMessages[1].role).toBe('assistant');
  });

  it('rechaza mensajes vacíos tras saneamiento', async () => {
    await expect(service.chat('user-1', undefined, '   <br>  ')).rejects.toThrow();
  });

  it('rechaza conversación ajena', async () => {
    mockConvRepo.findOne.mockResolvedValue({ id: 'conv-x', userId: 'other-user' });
    await expect(service.chat('user-1', 'conv-x', 'Hola')).rejects.toThrow('acceso');
  });
});
