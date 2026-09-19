import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmChatMessage, LlmProvider } from './llm-provider.interface.js';

/**
 * Adaptador OpenAI (Chat Completions) vía fetch nativo, sin SDK extra.
 * Lee OPENAI_API_KEY y LLM_MODEL (defecto gpt-4o-mini).
 */
@Injectable()
export class OpenaiLlmProvider implements LlmProvider {
  readonly name = 'openai';

  constructor(private readonly configService: ConfigService) {}

  async generateReply(messages: LlmChatMessage[]): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada para el proveedor openai');
    }
    const model = this.configService.get<string>('LLM_MODEL', 'gpt-4o-mini');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 500,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('OpenAI devolvió una respuesta vacía');
    }
    return content;
  }
}
