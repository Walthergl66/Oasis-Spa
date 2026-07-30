import React from 'react';
import type { AppointmentStatus, SpecialistStatus } from '../../types';

type Tone = 'green' | 'yellow' | 'gray' | 'red' | 'blue' | 'amber';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'gray', className = '' }) => (
  <span className={`badge ${tone} ${className}`.trim()}>{children}</span>
);

/** Traduce el estado de una cita al color y la etiqueta que ve el usuario. */
export const statusTone = (status: AppointmentStatus): Tone =>
  status === 'confirmada' ? 'green' : status === 'pendiente' ? 'yellow' : status === 'completada' ? 'gray' : 'red';

export const statusLabel = (status: AppointmentStatus): string =>
  ({ pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Completada', cancelada: 'Cancelada' })[status];

export const specialistTone = (status: SpecialistStatus): Tone =>
  status === 'Disponible' ? 'green' : status === 'En cita' ? 'yellow' : 'gray';

export const AppointmentBadge: React.FC<{ status: AppointmentStatus }> = ({ status }) => (
  <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
);
