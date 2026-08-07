/**
 * Contrato del asistente Luna.
 *
 * La lógica de negocio (flujos, formatos, reglas) vive en `LunaService` y es
 * independiente de *cómo* se interpreta el mensaje: la capa de comprensión
 * (`LunaNlu`) es pluggable. Hoy hay una implementación basada en reglas
 * (`RuleBasedNlu`) pensada para la defensa (determinista, sin dependencias de
 * red); mañana puede sustituirse por un modelo de lenguaje que devuelva el
 * mismo `LunaNluResult` (o que ejecute directamente las tools de `LUNA_TOOLS`).
 */

/** Opción de respuesta rápida que Luna ofrece a la clienta. */
export interface LunaOption {
  label: string;
  value: string;
}

/** Respuesta de POST /api/luna/chat. */
export interface LunaChatResponse {
  text: string;
  /** Nombre de la función del backend que se ejecutó para producir el texto. */
  fnTag?: string;
  options?: LunaOption[];
  /** true cuando la ejecución cambió datos (la clienta debe refrescar vistas). */
  mutated?: boolean;
  /** Identificador de la sesión en el servidor (para uso anónimo). */
  sessionId?: string;
}

/** Catálogo de funciones reales que Luna puede ejecutar. */
export interface LunaTool {
  name: string;
  description: string;
}

export const LUNA_TOOLS: LunaTool[] = [
  {
    name: 'listarServicios',
    description: 'Lista el catálogo de servicios con precio y duración.',
  },
  {
    name: 'consultarDisponibilidad',
    description: 'Consulta los horarios libres de un servicio en una fecha.',
  },
  {
    name: 'registrarCita',
    description: 'Registra una cita para la clienta autenticada.',
  },
  {
    name: 'consultarMisCitas',
    description: 'Devuelve las próximas citas de la clienta.',
  },
  {
    name: 'cancelarCita',
    description: 'Cancela una cita activa de la clienta.',
  },
  { name: 'listarPromociones', description: 'Lista las promociones vigentes.' },
] as const;

/** Intenciones que el asistente distingue. */
export type LunaIntentType =
  | 'reservar'
  | 'precios'
  | 'promociones'
  | 'mis-citas'
  | 'cancelar'
  | 'horarios'
  | 'especialistas'
  | 'saludo'
  | 'desconocido';

/** Interpretación de un mensaje: intención + datos extraídos. */
export interface LunaNluResult {
  intent: LunaIntentType;
  /** Servicio mencionado (resuelto contra el catálogo, no un id). */
  serviceName?: string;
  /** Fecha en formato YYYY-MM-DD. */
  date?: string;
  /** Hora en formato HH:mm. */
  time?: string;
  /** Para el flujo de cancelación: número elegido de la lista. */
  index?: number;
}

/** Lo que la capa de comprensión necesita saber del catálogo. */
export interface ServiceLike {
  name: string;
  category: string;
}

/**
 * Capa de comprensión del mensaje. Reemplazable por un modelo de lenguaje sin
 * tocar el resto del módulo.
 */
export interface LunaNlu {
  parse(message: string, context: { services: ServiceLike[] }): LunaNluResult;
}

/** Token de inyección de la capa de comprensión (apunta a `RuleBasedNlu` hoy). */
export const LUNA_NLU = Symbol('LunaNlu');
