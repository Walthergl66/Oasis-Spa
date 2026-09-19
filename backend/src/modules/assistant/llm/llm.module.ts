import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLM_PROVIDER_TOKEN } from './llm-provider.interface.js';
import type { LlmProvider } from './llm-provider.interface.js';
import { MockLlmProvider } from './mock-llm.provider.js';
import { OpenaiLlmProvider } from './openai-llm.provider.js';
import { GeminiLlmProvider } from './gemini-llm.provider.js';

/**
 * Selección del proveedor con una sola línea de configuración:
 * LLM_PROVIDER=mock|openai|gemini (ver .env.example y Sprint 5 del plan).
 * Desconocido => mock seguro para no romper el arranque.
 */
@Module({
  providers: [
    MockLlmProvider,
    OpenaiLlmProvider,
    GeminiLlmProvider,
    {
      provide: LLM_PROVIDER_TOKEN,
      inject: [ConfigService, MockLlmProvider, OpenaiLlmProvider, GeminiLlmProvider],
      useFactory: (
        config: ConfigService,
        mock: LlmProvider,
        openai: LlmProvider,
        gemini: LlmProvider,
      ): LlmProvider => {
        const selected = (config.get<string>('LLM_PROVIDER', 'mock') || 'mock').toLowerCase();
        if (selected === 'openai') return openai;
        if (selected === 'gemini') return gemini;
        return mock;
      },
    },
  ],
  exports: [LLM_PROVIDER_TOKEN, MockLlmProvider, OpenaiLlmProvider, GeminiLlmProvider],
})
export class LlmModule {}
