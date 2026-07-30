import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como accesible sin sesión.
 *
 * El guard de autenticación se registra de forma global, así que **todo está
 * protegido por defecto**: olvidarse de proteger un endpoint no abre un agujero;
 * olvidarse de abrirlo sólo produce un 401 evidente en la primera prueba.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
