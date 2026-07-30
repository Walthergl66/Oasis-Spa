import type { LoyaltyLevel } from '../types';

/** Umbral de puntos para cada nivel del programa de fidelidad. */
export const LEVEL_THRESHOLDS: { level: LoyaltyLevel; min: number }[] = [
  { level: 'Bronce', min: 0 },
  { level: 'Ámbar', min: 300 },
  { level: 'Oro', min: 600 },
];

/** 1 punto por cada dólar facturado en una cita completada. */
export function pointsForPrice(price: number): number {
  return Math.round(price);
}

export function levelForPoints(points: number): LoyaltyLevel {
  let current: LoyaltyLevel = 'Bronce';
  for (const t of LEVEL_THRESHOLDS) if (points >= t.min) current = t.level;
  return current;
}

/** Puntos necesarios para el siguiente nivel; null si ya está en el máximo. */
export function nextLevelTarget(points: number): { level: LoyaltyLevel; min: number } | null {
  return LEVEL_THRESHOLDS.find(t => t.min > points) ?? null;
}

export function levelProgress(points: number): { pct: number; missing: number; next: LoyaltyLevel | null } {
  const next = nextLevelTarget(points);
  if (!next) return { pct: 100, missing: 0, next: null };
  const currentMin = [...LEVEL_THRESHOLDS].reverse().find(t => points >= t.min)?.min ?? 0;
  const pct = Math.round(((points - currentMin) / (next.min - currentMin)) * 100);
  return { pct: Math.min(100, Math.max(0, pct)), missing: next.min - points, next: next.level };
}
