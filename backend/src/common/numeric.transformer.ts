import { ValueTransformer } from 'typeorm';

/**
 * Convierte las columnas `numeric` de PostgreSQL a `number` de JavaScript.
 *
 * El driver de pg devuelve `numeric` como **cadena** para no perder precisión
 * en valores muy grandes. Sin este transformador, un precio de 28.00 llegaría
 * al frontend como `"28.00"` y cualquier suma produciría concatenación en lugar
 * de aritmética. Los importes de un spa caben de sobra en un `number`.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
};
