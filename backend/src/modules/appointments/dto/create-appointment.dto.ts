import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

/**
 * Solicitud de reserva.
 *
 * La fecha y la hora viajan separadas y en horario del spa, no como un instante
 * ISO: la clienta elige "el martes a las 10:00" en la agenda del negocio, no un
 * momento UTC. El servidor las combina.
 *
 * `clientId` sólo lo respeta el personal, para reservar desde recepción a
 * nombre de una clienta. Si lo envía una clienta se ignora: su reserva se
 * registra siempre a su nombre, tomado del token.
 */
export class CreateAppointmentDto {
  @IsUUID('4', { message: 'El servicio indicado no es válido.' })
  serviceId: string;

  /** Fecha del spa, formato YYYY-MM-DD. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD.',
  })
  date: string;

  /** Hora de inicio, formato HH:mm (24 h). */
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora debe tener formato HH:mm.',
  })
  time: string;

  /** Si se omite, se asigna la especialista con menos carga ese día. */
  @IsOptional()
  @IsUUID('4', { message: 'La especialista indicada no es válida.' })
  specialistId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  /** Sólo lo respeta el personal (admin o especialista). */
  @IsOptional()
  @IsUUID('4', { message: 'La clienta indicada no es válida.' })
  clientId?: string;
}
