import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmChatMessage, LlmProvider } from './llm-provider.interface.js';

/**
 * Adaptador Google Gemini (generateContent) vía fetch nativo, sin SDK extra.
 * Lee GEMINI_API_KEY y LLM_MODEL (defecto gemini-1.5-flash).
 */
@Injectable()
export class GeminiLlmProvider implements LlmProvider {
  readonly name = 'gemini';

  constructor(private readonly configService: ConfigService) {}

  async generateReply(messages: LlmChatMessage[]): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no configurada para el proveedor gemini');
    }
    const model = this.configService.get<string>('LLM_MODEL', 'gemini-1.5-flash');

    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: system ? { parts: [{ text: system }] } : undefined,
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw new Error('Gemini devolvió una respuesta vacía');
    }
    return text;
  }
}
