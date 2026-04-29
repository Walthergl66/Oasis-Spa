import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
  return (
    <div className="stats-card">
      {icon && <div className="stats-icon">{icon}</div>}
      <h3>{title}</h3>
      <p className="stats-value">{value}</p>
    </div>
  );
};
