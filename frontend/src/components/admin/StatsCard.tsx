import React from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  delta?: string;
  tone?: 'green' | 'yellow' | 'accent';
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, delta, tone = 'green' }) => {
  const color = tone === 'green' ? 'var(--green)' : tone === 'yellow' ? 'var(--yellow)' : 'var(--accent)';
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta && <div className="kpi-delta" style={{ color }}>{delta}</div>}
    </div>
  );
};
