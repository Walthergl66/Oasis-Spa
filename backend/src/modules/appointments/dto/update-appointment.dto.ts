import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

/** Nuevo horario para una cita existente. */
export class RescheduleAppointmentDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD.',
  })
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora debe tener formato HH:mm.',
  })
  time: string;

  @IsOptional()
  @IsUUID('4')
  specialistId?: string;
}

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  @Length(0, 255)
  reason?: string;
}

/**
 * Cambio de estado desde el panel.
 *
 * `cancelada` no se acepta aquí: cancelar tiene efectos propios —registrar el
 * motivo y la fecha, liberar la franja— y vive en su propio endpoint.
 */
export class UpdateStatusDto {
  @IsIn(
    [
      AppointmentStatus.PENDIENTE,
      AppointmentStatus.CONFIRMADA,
      AppointmentStatus.COMPLETADA,
    ],
    {
      message:
        'Estado no válido. Para cancelar usa PATCH /appointments/:id/cancel.',
    },
  )
  status: AppointmentStatus;
}
