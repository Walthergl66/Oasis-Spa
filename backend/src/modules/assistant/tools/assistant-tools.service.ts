import { Injectable } from '@nestjs/common';
import { ServicesService } from '../../services/services.service.js';
import { AvailabilityService } from '../../availability/availability.service.js';
import { AppointmentsService } from '../../appointments/appointments.service.js';
import { AppointmentStatus } from '../../appointments/enums/appointment-status.enum.js';
import { Role } from '../../../common/enums/role.enum.js';
import type {
  ToolContext,
  ToolDefinition,
  ToolResult,
} from './tool-definition.interface.js';

interface PendingProposal {
  tool: string;
  args: Record<string, unknown>;
  summary: string;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHm(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Convierte fecha+hora local del spa (UTC-5) a ISO UTC para la API. */
export function spaToUtcIso(fecha: string, hora: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h + 5, min, 0)).toISOString();
}

function safeError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    return message.split('\n')[0].slice(0, 300);
  }
  return 'Ocurrió un error inesperado. Intente nuevamente.';
}

/**
 * Registro y ejecución de herramientas del asistente (RF-20, RF-21).
 * Toda la lógica de negocio vive en los servicios del backend; las tools
 * son adaptadores delgados que validan argumentos, exigen identidad del
 * JWT y aplican confirmación en dos pasos para mutaciones.
 */
@Injectable()
export class AssistantToolsService {
  private readonly tools = new Map<string, ToolDefinition>();
  /** Propuestas pendientes de confirmación por usuario (flujo en dos pasos). */
  private readonly pending = new Map<string, PendingProposal>();

  constructor(
    private readonly servicesService: ServicesService,
    private readonly availabilityService: AvailabilityService,
    private readonly appointmentsService: AppointmentsService,
  ) {
    this.register({
      name: 'listarServicios',
      description:
        'Lista el catálogo de servicios activos del spa con precio y duración. Úsala cuando pregunten qué servicios, tratamientos o precios hay.',
      parameters: {
        categoria: {
          type: 'string',
          description: 'Filtrar por categoría (opcional)',
          required: false,
          example: 'Facial',
        },
      },
      handler: (args) => this.listarServicios(args),
    });
    this.register({
      name: 'consultarDisponibilidad',
      description:
        'Consulta espacios libres reales para un servicio en una fecha. NUNCA inventes horarios: usa siempre esta herramienta.',
      parameters: {
        serviceId: { type: 'string', description: 'UUID del servicio', required: true },
        fecha: { type: 'string', description: 'Fecha YYYY-MM-DD', required: true, example: '2026-09-25' },
        employeeId: { type: 'string', description: 'UUID del especialista (opcional)', required: false },
      },
      handler: (args) => this.consultarDisponibilidad(args),
    });
    this.register({
      name: 'registrarCita',
      description:
        'Registra una cita. FLUJO EN DOS PASOS: primero llámala con confirmado=false para proponer el resumen; solo con confirmado=true y confirmación explícita del cliente se crea la cita.',
      parameters: {
        serviceId: { type: 'string', description: 'UUID del servicio', required: true },
        fecha: { type: 'string', description: 'Fecha YYYY-MM-DD', required: true },
        hora: { type: 'string', description: 'Hora HH:mm local del spa', required: true, example: '10:00' },
        employeeId: { type: 'string', description: 'UUID del especialista (opcional: se asigna el primero libre)', required: false },
        notas: { type: 'string', description: 'Preferencias del cliente (opcional)', required: false },
        confirmado: { type: 'boolean', description: 'true solo si el cliente ya confirmó el resumen', required: true },
      },
      handler: (args, ctx) => this.registrarCita(args, ctx),
    });
    this.register({
      name: 'modificarCita',
      description:
        'Reprograma una cita existente a nueva fecha/hora. Requiere confirmado=true tras proponer el cambio; respeta el margen de 2h.',
      parameters: {
        appointmentId: { type: 'string', description: 'UUID de la cita (si se conoce)', required: false },
        fecha: { type: 'string', description: 'Fecha actual de la cita para identificarla (si no hay ID)', required: false },
        nuevaFecha: { type: 'string', description: 'Nueva fecha YYYY-MM-DD', required: true },
        nuevaHora: { type: 'string', description: 'Nueva hora HH:mm', required: true },
        confirmado: { type: 'boolean', description: 'true solo con confirmación explícita', required: true },
      },
      handler: (args, ctx) => this.modificarCita(args, ctx),
    });
    this.register({
      name: 'cancelarCita',
      description:
        'Cancela una cita existente. Requiere confirmado=true tras proponer; respeta el margen de 2h salvo admin.',
      parameters: {
        appointmentId: { type: 'string', description: 'UUID de la cita (si se conoce)', required: false },
        fecha: { type: 'string', description: 'Fecha de la cita para identificarla (si no hay ID)', required: false },
        motivo: { type: 'string', description: 'Motivo de cancelación (opcional)', required: false },
        confirmado: { type: 'boolean', description: 'true solo con confirmación explícita', required: true },
      },
      handler: (args, ctx) => this.cancelarCita(args, ctx),
    });
  }

  listSchemas(): Array<Pick<ToolDefinition, 'name' | 'description' | 'parameters'>> {
    return [...this.tools.values()].map(({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    }));
  }

  getPending(userId: string): PendingProposal | undefined {
    return this.pending.get(userId);
  }

  clearPending(userId: string): void {
    this.pending.delete(userId);
  }

  async confirmPending(ctx: ToolContext): Promise<ToolResult> {
    const proposal = this.pending.get(ctx.userId);
    if (!proposal) {
      return { ok: false, error: 'No hay ninguna propuesta pendiente de confirmación.' };
    }
    this.pending.delete(ctx.userId);
    return this.execute(proposal.tool, { ...proposal.args, confirmado: true }, ctx);
  }

  async execute(
    name: string,
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { ok: false, error: `Herramienta desconocida: ${name}.` };
    }
    if (!ctx.userId) {
      return { ok: false, error: 'Operación no autorizada: falta identidad del usuario.' };
    }
    try {
      return await tool.handler(args, ctx);
    } catch (error) {
      return { ok: false, error: safeError(error) };
    }
  }

  private register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  private async listarServicios(args: Record<string, unknown>): Promise<ToolResult> {
    const categoria =
      typeof args.categoria === 'string' && args.categoria.trim()
        ? args.categoria.trim()
        : undefined;
    const services = await this.servicesService.findAllActive(categoria);
    if (services.length === 0) {
      return { ok: false, error: 'Por ahora no hay servicios activos en esa categoría.' };
    }
    const lines = services.map(
      (s) => `- ${s.name}: $${Number(s.price)} (${s.durationMinutes} min)`,
    );
    return {
      ok: true,
      summary: `Servicios disponibles:\n${lines.join('\n')}`,
      data: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        durationMinutes: s.durationMinutes,
        category: s.category,
      })),
    };
  }

  private async consultarDisponibilidad(
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    if (!isUuid(args.serviceId)) {
      return { ok: false, error: 'Necesito el servicio para consultar disponibilidad.' };
    }
    if (!isYmd(args.fecha)) {
      return { ok: false, error: 'Necesito la fecha en formato YYYY-MM-DD.' };
    }
    if (args.employeeId !== undefined && !isUuid(args.employeeId)) {
      return { ok: false, error: 'El especialista indicado no es válido.' };
    }
    const result = await this.availabilityService.getAvailableSlots({
      serviceId: args.serviceId,
      date: args.fecha,
      employeeId: args.employeeId as string | undefined,
    });
    if (result.availableSlots.length === 0) {
      return {
        ok: true,
        summary: `No hay espacios libres para ${result.serviceName} el ${result.date}. Sugiere otra fecha.`,
        data: result,
      };
    }
    const top = result.availableSlots.slice(0, 8).map(
      (s) => `- ${s.startTimeFormatted}–${s.endTimeFormatted} con ${s.employeeName}`,
    );
    return {
      ok: true,
      summary: `Espacios libres para ${result.serviceName} el ${result.date}:\n${top.join('\n')}`,
      data: result,
    };
  }

  private async registrarCita(
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolResult> {
    if (!isUuid(args.serviceId) || !isYmd(args.fecha) || !isHm(args.hora)) {
      return {
        ok: false,
        error: 'Para reservar necesito el servicio, la fecha (YYYY-MM-DD) y la hora (HH:mm).',
      };
    }
    if (args.employeeId !== undefined && !isUuid(args.employeeId)) {
      return { ok: false, error: 'El especialista indicado no es válido.' };
    }

    const service = await this.servicesService.findById(args.serviceId);
    const startIso = spaToUtcIso(args.fecha, args.hora);
    let employeeId = args.employeeId as string | undefined;
    let employeeName = 'primer especialista disponible';

    if (!employeeId) {
      const availability = await this.availabilityService.getAvailableSlots({
        serviceId: service.id,
        date: args.fecha,
      });
      const match = availability.availableSlots.find((s) => s.startTime === startIso);
      if (!match) {
        return {
          ok: false,
          error: `Ese horario (${args.hora}) no está libre el ${args.fecha}. Pide otra hora de la lista de disponibilidad.`,
        };
      }
      employeeId = match.employeeId;
      employeeName = match.employeeName;
    }

    const proposal: PendingProposal = {
      tool: 'registrarCita',
      args: { ...args, employeeId },
      summary: '',
    };

    if (args.confirmado !== true) {
      const text =
        `Propuesta de reserva:\n- Servicio: ${service.name} ($${Number(service.price)}, ${service.durationMinutes} min)\n` +
        `- Fecha: ${args.fecha} ${args.hora} (hora del spa)\n- Especialista: ${employeeName}\n\n` +
        `¿Confirmas esta reserva? Responde "sí, confirmo" para registrarla o "no" para descartarla.`;
      proposal.summary = text;
      this.pending.set(ctx.userId, proposal);
      return { ok: true, needsConfirmation: true, summary: text, data: proposal.args };
    }

    const created = await this.appointmentsService.createAppointment(ctx.userId, {
      serviceId: service.id,
      employeeId,
      startTime: startIso,
      notes: typeof args.notas === 'string' ? args.notas : undefined,
    });
    this.pending.delete(ctx.userId);
    return {
      ok: true,
      summary:
        `Cita registrada: ${service.name} el ${args.fecha} ${args.hora} (hora del spa). ` +
        `Estado: ${created.status}. Llega 10 minutos antes.`,
      data: { id: created.id, startTime: created.startTime, status: created.status },
    };
  }

  private async findClientAppointment(
    ctx: ToolContext,
    appointmentId?: unknown,
    fecha?: unknown,
  ): Promise<
    | { ok: true; id: string }
    | { ok: false; error: string }
  > {
    if (isUuid(appointmentId)) {
      const appointment = await this.appointmentsService.findById(appointmentId);
      if (ctx.role === Role.CLIENT && appointment.clientId !== ctx.userId) {
        return { ok: false, error: 'Solo puedes gestionar tus propias citas.' };
      }
      return { ok: true, id: appointment.id };
    }
    const mine = await this.appointmentsService.findByClient(ctx.userId);
    const active = mine.filter(
      (a) => a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED,
    );
    const scoped = isYmd(fecha)
      ? active.filter(
          (a) => new Date(a.startTime).toISOString().slice(0, 10) === fecha,
        )
      : active;
    if (scoped.length === 0) {
      return { ok: false, error: 'No encontré una cita activa tuya para esa fecha. Indica cuál (servicio y fecha).' };
    }
    if (scoped.length > 1) {
      const options = scoped
        .map((a) => `- ${a.service?.name ?? 'Servicio'} el ${new Date(a.startTime).toISOString().slice(0, 16).replace('T', ' ')} UTC`)
        .join('\n');
      return { ok: false, error: `Tienes varias citas activas. ¿Cuál quieres gestionar?\n${options}` };
    }
    return { ok: true, id: scoped[0].id };
  }

  private async modificarCita(
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolResult> {
    if (!isYmd(args.nuevaFecha) || !isHm(args.nuevaHora)) {
      return { ok: false, error: 'Para reprogramar necesito la nueva fecha (YYYY-MM-DD) y hora (HH:mm).' };
    }
    const target = await this.findClientAppointment(ctx, args.appointmentId, args.fecha);
    if (!target.ok) return target;

    if (args.confirmado !== true) {
      const text =
        `Propuesta de reprogramación al ${args.nuevaFecha} ${args.nuevaHora} (hora del spa). ` +
        `Recuerda el margen mínimo de 2 horas.\n\n¿Confirmas el cambio? Responde "sí, confirmo" o "no".`;
      this.pending.set(ctx.userId, {
        tool: 'modificarCita',
        args,
        summary: text,
      });
      return { ok: true, needsConfirmation: true, summary: text };
    }

    const updated = await this.appointmentsService.rescheduleAppointment(
      target.id,
      ctx.userId,
      ctx.role,
      { startTime: spaToUtcIso(args.nuevaFecha, args.nuevaHora) },
    );
    this.pending.delete(ctx.userId);
    return {
      ok: true,
      summary: `Cita reprogramada al ${args.nuevaFecha} ${args.nuevaHora} (hora del spa). Estado: ${updated.status}.`,
      data: { id: updated.id, startTime: updated.startTime },
    };
  }

  private async cancelarCita(
    args: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolResult> {
    const target = await this.findClientAppointment(ctx, args.appointmentId, args.fecha);
    if (!target.ok) return target;

    if (args.confirmado !== true) {
      const text =
        `Vas a cancelar tu cita${isYmd(args.fecha) ? ` del ${args.fecha}` : ''}. ` +
        `Recuerda el margen mínimo de 2 horas.\n\n¿Confirmas la cancelación? Responde "sí, confirmo" o "no".`;
      this.pending.set(ctx.userId, {
        tool: 'cancelarCita',
        args,
        summary: text,
      });
      return { ok: true, needsConfirmation: true, summary: text };
    }

    const cancelled = await this.appointmentsService.cancelAppointment(
      target.id,
      ctx.userId,
      ctx.role,
      typeof args.motivo === 'string' && args.motivo.trim()
        ? { reason: args.motivo.trim() }
        : {},
    );
    this.pending.delete(ctx.userId);
    return {
      ok: true,
      summary: 'Cita cancelada correctamente. Puedes reservar de nuevo cuando quieras.',
      data: { id: cancelled.id, status: cancelled.status },
    };
  }
}
