import type { Role } from '../../../common/enums/role.enum.js';

/**
 * Identidad autenticada con la que SIEMPRE se ejecutan las tools (RF-21).
 * Viene del JWT (@CurrentUser) y se propaga sin que el modelo pueda alterarla:
 * un cliente solo puede tocar sus propias citas.
 */
export interface ToolContext {
  userId: string;
  role: Role;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean';
  description: string;
  required?: boolean;
  example?: string;
  enum?: string[];
}

/**
 * Definición de herramienta (RF-20): nombre, descripción y esquema
 * declarados FUERA del modelo de lenguaje. El LLM solo elige la
 * herramienta y los argumentos; la ejecución vive en el backend.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

export interface ToolSuccess {
  ok: true;
  /** Resumen legible que el LLM usará para redactar su respuesta. */
  summary: string;
  data?: unknown;
  /** Propuesta pendiente de confirmación (flujo en dos pasos). */
  needsConfirmation?: boolean;
}

export interface ToolFailure {
  ok: false;
  /** Mensaje seguro para mostrar al usuario (sin stack traces). */
  error: string;
}

export type ToolResult = ToolSuccess | ToolFailure;
