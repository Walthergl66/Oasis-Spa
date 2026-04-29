import React from 'react';

interface AppointmentCardProps {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  serviceName,
  date,
  time,
  status
}) => {
  return (
    <div className={`appointment-card appointment-${status}`}>
      <h4>{serviceName}</h4>
      <p>{date} at {time}</p>
      <span className="status">{status}</span>
    </div>
  );
};
