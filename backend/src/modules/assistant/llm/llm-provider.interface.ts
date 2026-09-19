export type LlmRole = 'system' | 'user' | 'assistant';

export interface LlmChatMessage {
  role: LlmRole;
  content: string;
}

/**
 * Contrato abstracto del proveedor de lenguaje (RNF-11).
 * El asistente solo depende de esta interfaz: cambiar de modelo
 * es cambiar `LLM_PROVIDER=mock|openai|gemini` en el .env.
 * Los tools/function-calling del Sprint 6 se apoyan en este mismo contrato.
 */
export interface LlmProvider {
  readonly name: string;
  generateReply(messages: LlmChatMessage[]): Promise<string>;
}

export const LLM_PROVIDER_TOKEN = Symbol('LLM_PROVIDER');
