import { IsOptional, Matches } from 'class-validator';

/**
 * Día del que se consulta la carga del equipo.
 *
 * El valor viaja hasta un `::date` de PostgreSQL, así que se valida el formato
 * aquí en lugar de dejar que lo interprete el motor: `11-06-2030` sería un día
 * perfectamente válido para Postgres (lo lee como MDY) y devolvería un reporte
 * vacío sin avisar de nada, mientras que un texto cualquiera reventaría en la
 * consulta y saldría como error 500. Con el patrón fijo, lo ambiguo se rechaza
 * con un 400 que dice qué formato se espera.
 */
export class SpecialistLoadQueryDto {
  /** Fecha del spa, formato YYYY-MM-DD. Si se omite, se asume hoy. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD.',
  })
  date?: string;
}
