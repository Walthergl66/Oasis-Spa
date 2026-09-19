import { describe, it, expect } from 'vitest';
import {
  detectConfirmation,
  detectDenial,
  detectToolIntent,
  extractAllDates,
  extractDate,
  extractTime,
  resolveService,
} from './intent-parser.js';

// 2026-09-19 12:00Z = 07:00 en el spa (sábado)
const NOW = new Date('2026-09-19T12:00:00.000Z');

describe('detectToolIntent (prioridad cancel > reschedule > book > ...)', () => {
  it('clasifica cada intención', () => {
    expect(detectToolIntent('quiero cancelar mi cita')).toBe('cancel');
    expect(detectToolIntent('necesito reprogramar mi cita')).toBe('reschedule');
    expect(detectToolIntent('quiero reservar una cita')).toBe('book');
    expect(detectToolIntent('cuáles son mis citas')).toBe('my_appointments');
    expect(detectToolIntent('qué disponibilidad hay')).toBe('check_availability');
    expect(detectToolIntent('qué servicios y precios tienen')).toBe('list_services');
    expect(detectToolIntent('hola, buenos días')).toBeNull();
  });
});

describe('extractDate / extractAllDates (calendario UTC-5)', () => {
  it('hoy, mañana y pasado mañana', () => {
    expect(extractDate('hoy en la tarde', NOW)).toBe('2026-09-19');
    expect(extractDate('mañana por favor', NOW)).toBe('2026-09-20');
    expect(extractDate('pasado mañana', NOW)).toBe('2026-09-21');
  });

  it('ISO, latino y próximo día de semana', () => {
    expect(extractDate('el 2026-09-25', NOW)).toBe('2026-09-25');
    expect(extractDate('el 25/09', NOW)).toBe('2026-09-25');
    expect(extractDate('el viernes', NOW)).toBe('2026-09-25');
  });

  it('extrae ambas fechas en reprogramaciones', () => {
    expect(extractAllDates('mueve mi cita de mañana al viernes', NOW)).toEqual([
      '2026-09-20',
      '2026-09-25',
    ]);
  });
});

describe('extractTime', () => {
  it('HH:mm y lenguaje natural', () => {
    expect(extractTime('a las 10:00')).toBe('10:00');
    expect(extractTime('a las 3 de la tarde')).toBe('15:00');
    expect(extractTime('mañana temprano')).toBeNull();
  });
});

describe('detectConfirmation / detectDenial', () => {
  it('afirmaciones y negaciones', () => {
    expect(detectConfirmation('Sí, confirmo')).toBe(true);
    expect(detectConfirmation('dale, procede')).toBe(true);
    expect(detectConfirmation('quiero reservar')).toBe(false);
    expect(detectDenial('no, mejor no')).toBe(true);
    expect(detectDenial('sí, confirmo')).toBe(false);
  });
});

describe('resolveService', () => {
  const catalog = [
    { id: '1', name: 'Masaje Relajante' },
    { id: '2', name: 'Limpieza Facial Profunda' },
  ];

  it('match por nombre más largo y por palabra clave', () => {
    expect(resolveService(catalog, 'quiero un masaje relajante mañana')?.id).toBe('1');
    expect(resolveService(catalog, 'precio del facial')?.id).toBe('2');
    expect(resolveService(catalog, 'hola, info general')).toBeNull();
  });
});
