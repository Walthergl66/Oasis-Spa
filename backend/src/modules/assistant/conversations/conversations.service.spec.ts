import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationsService } from './conversations.service.js';
import { sanitizeUserMessage } from './assistant-prompts.js';
import { MockLlmProvider } from '../llm/mock-llm.provider.js';
import { Role } from '../../../common/enums/role.enum.js';

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

describe('ConversationsService (Sprint 5+6: historial, LLM y tools)', () => {
  let service: ConversationsService;
  let mockConvRepo: any;
  let mockMsgRepo: any;
  let mockServices: any;
  let mockTools: any;
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
    mockServices = { findAllActive: vi.fn().mockResolvedValue([]) };
    mockTools = {
      getPending: vi.fn().mockReturnValue(undefined),
      clearPending: vi.fn(),
      confirmPending: vi.fn(),
      execute: vi.fn(),
    };
    service = new ConversationsService(
      mockConvRepo,
      mockMsgRepo,
      new MockLlmProvider(),
      mockServices,
      mockTools,
    );
  });

  it('crea conversación nueva y persiste turno user + assistant (vía LLM)', async () => {
    const result = await service.chat('user-1', Role.CLIENT, undefined, 'Hola, <b>quiero info</b>');
    expect(result.conversationId).toBe('conv-1');
    expect(result.reply.length).toBeGreaterThan(10);
    expect(savedMessages).toHaveLength(2);
    expect(savedMessages[0].content).toBe('Hola, quiero info');
    expect(savedMessages[0].role).toBe('user');
    expect(savedMessages[1].role).toBe('assistant');
  });

  it('rechaza mensajes vacíos tras saneamiento', async () => {
    await expect(service.chat('user-1', Role.CLIENT, undefined, '   <br>  ')).rejects.toThrow();
  });

  it('rechaza conversación ajena', async () => {
    mockConvRepo.findOne.mockResolvedValue({ id: 'conv-x', userId: 'other-user' });
    await expect(service.chat('user-1', Role.CLIENT, 'conv-x', 'Hola')).rejects.toThrow('acceso');
  });

  it('enruta catálogo a listarServicios y devuelve el resumen verbatim', async () => {
    mockTools.execute.mockResolvedValue({ ok: true, summary: 'Servicios disponibles:\n- Masaje' });
    const result = await service.chat('user-1', Role.CLIENT, undefined, '¿Qué servicios tienen?');
    expect(mockTools.execute).toHaveBeenCalledWith('listarServicios', {}, { userId: 'user-1', role: Role.CLIENT });
    expect(result.reply).toContain('Masaje');
  });

  it('confirma propuesta pendiente con un sí', async () => {
    mockTools.getPending.mockReturnValue({ tool: 'registrarCita', args: {}, summary: 'Propuesta' });
    mockTools.confirmPending.mockResolvedValue({ ok: true, summary: 'Cita registrada' });
    const result = await service.chat('user-1', Role.CLIENT, undefined, 'Sí, confirmo');
    expect(mockTools.confirmPending).toHaveBeenCalled();
    expect(result.reply).toContain('registrada');
  });

  it('descarta propuesta pendiente con un no', async () => {
    mockTools.getPending.mockReturnValue({ tool: 'registrarCita', args: {}, summary: 'Propuesta' });
    const result = await service.chat('user-1', Role.CLIENT, undefined, 'No, mejor no');
    expect(mockTools.clearPending).toHaveBeenCalledWith('user-1');
    expect(result.reply).toContain('descarté');
  });
});
