import { Injectable } from '@nestjs/common';
import type { LlmChatMessage, LlmProvider } from './llm-provider.interface.js';

/**
 * Proveedor determinista para desarrollo, tests y evaluación SUS.
 * Sin red ni API keys: respuestas por reglas de intención en español.
 * El function-calling real llega en el Sprint 6; aquí el mock deriva
 * al catálogo y a disponibilidad sin inventar horarios.
 */
@Injectable()
export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';

  async generateReply(messages: LlmChatMessage[]): Promise<string> {
    const lastUser =
      [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const text = lastUser.toLowerCase();

    if (/(hola|buenas|buenos días|buenas tardes|hello|hi)\b/.test(text)) {
      return '¡Hola! Soy el asistente virtual de Oasis Spa. Puedo contarte sobre nuestros servicios, horarios y ayudarte a reservar. ¿Qué te gustaría hacer hoy?';
    }
    if (/(servicio|catálogo|catalogo|masaje|facial|precio|cuánto|cuanto)/.test(text)) {
      return 'Tenemos masajes relajantes, limpiezas faciales, tratamientos corporales y más. Puedes ver el catálogo completo en /services/active con precios y duraciones. ¿Te interesa algún tratamiento en particular?';
    }
    if (/(horario|disponib|agenda|cita disponible|cuándo|cuando|turno)/.test(text)) {
      return 'Para consultar disponibilidad dime el servicio y la fecha (por ejemplo: "masaje relajante mañana"). Consulto los espacios libres reales del especialista sin inventar horarios.';
    }
    if (/(reserv|agend|apart|quiero.*cita|cita.*mañana|cita.*hoy)/.test(text)) {
      return '¡Perfecto! Para reservar necesito: 1) el servicio, 2) la fecha y hora, 3) el especialista (opcional). En el siguiente paso confirmaremos juntos los datos antes de registrar la cita. ¿Qué servicio te gustaría?';
    }
    if (/(cancel|reprogram|modific|cambiar.*cita)/.test(text)) {
      return 'Puedo ayudarte a cancelar o reprogramar. Recuerda que se requiere mínimo 2 horas de antelación. Dime tu cita (fecha o servicio) y la gestionamos.';
    }
    if (/(gracias|thank)/.test(text)) {
      return '¡Con gusto! Quedo atento si necesitas algo más para tu bienestar.';
    }
    return 'Entendido. Soy el asistente de Oasis Spa: puedo informar sobre servicios, consultar disponibilidad real y ayudarte a reservar, cancelar o reprogramar. ¿Me cuentas un poco más de lo que buscas?';
  }
}
