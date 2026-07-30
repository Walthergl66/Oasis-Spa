import React from 'react';
import { useCatalogStore } from '../../store/catalogStore';
import type { Appointment } from '../../types';
import { EmptyState } from '../ui/Feedback';
import { AppointmentCard } from './AppointmentCard';

interface AppointmentListProps {
  appointments: Appointment[];
  emptyTitle: string;
  emptyText?: string;
  emptyAction?: React.ReactNode;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onRebook?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments, emptyTitle, emptyText, emptyAction, ...handlers
}) => {
  const services = useCatalogStore(state => state.services);

  if (appointments.length === 0) {
    return <EmptyState icon="📅" title={emptyTitle} text={emptyText} action={emptyAction} />;
  }

  return (
    <div>
      {appointments.map(appointment => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          service={services.find(s => s.id === appointment.serviceId)}
          {...handlers}
        />
      ))}
    </div>
  );
};
