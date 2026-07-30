/**
 * Punto único de conmutación entre el repositorio local y el backend NestJS.
 *
 * Cada función de `src/services/` declara su llamada HTTP real y, al lado, la
 * implementación local equivalente. Hoy (VITE_USE_MOCK=true) se ejecuta la
 * local; al levantar NestJS basta con poner VITE_USE_MOCK=false y las mismas
 * vistas empiezan a consumir la API sin ningún cambio de código.
 */
import axios from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const USE_MOCK: boolean = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

export const http = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

/** Adjunta el token JWT que emitirá NestJS. */
export function setAuthToken(token: string | null): void {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

/** Pequeña latencia para que la interfaz muestre sus estados de carga reales. */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';

interface RequestOptions<T> {
  method: Method;
  /** Ruta relativa de la API real, p. ej. '/appointments'. */
  path: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  /** Implementación local equivalente mientras no exista el backend. */
  mock: () => T | Promise<T>;
}

export async function request<T>({ method, path, body, params, mock }: RequestOptions<T>): Promise<T> {
  if (USE_MOCK) {
    await delay(120 + Math.random() * 180);
    return await mock();
  }
  const response = await http.request<T>({ method, url: path, data: body, params });
  return response.data;
}

/** Error de dominio: mismo formato que devolverá NestJS (mensaje + código). */
export class ApiError extends Error {
  code: string;
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** Normaliza cualquier error (local o de axios) a un mensaje mostrable. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (data?.message) return data.message;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}
