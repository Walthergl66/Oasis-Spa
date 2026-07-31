/**
 * Códigos de error de PostgreSQL que el dominio necesita distinguir.
 * Referencia: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const FOREIGN_KEY_VIOLATION = '23503';
const UNIQUE_VIOLATION = '23505';
const EXCLUSION_VIOLATION = '23P01';

interface DriverError {
  code?: string;
}

function pgCode(error: unknown): string | undefined {
  const driverError = (error as { driverError?: DriverError })?.driverError;
  return driverError?.code ?? (error as DriverError)?.code;
}

/** La fila está referenciada por otra tabla (o referencia algo inexistente). */
export const isForeignKeyViolation = (error: unknown): boolean =>
  pgCode(error) === FOREIGN_KEY_VIOLATION;

/** Ya existe un registro con ese valor único. */
export const isUniqueViolation = (error: unknown): boolean =>
  pgCode(error) === UNIQUE_VIOLATION;

/**
 * Restricción EXCLUDE: en este sistema significa que la especialista ya tiene
 * una cita que se solapa con la que se intenta registrar.
 */
export const isExclusionViolation = (error: unknown): boolean =>
  pgCode(error) === EXCLUSION_VIOLATION;
