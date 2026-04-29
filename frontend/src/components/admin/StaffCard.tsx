import React from 'react';

interface StaffCardProps {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  name,
  role,
  email,
  phone
}) => {
  return (
    <div className="staff-card">
      <h3>{name}</h3>
      <p className="role">{role}</p>
      <p>{email}</p>
      {phone && <p>{phone}</p>}
    </div>
  );
};
