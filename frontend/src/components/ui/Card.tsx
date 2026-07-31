import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Título opcional del panel (estilo del panel administrativo). */
  title?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => (
  <div className={`admin-panel ${className}`.trim()}>
    {(title || actions) && (
      <div className="admin-panel-head">
        {title && <div className="admin-panel-title mb-0">{title}</div>}
        {actions}
      </div>
    )}
    {children}
  </div>
);
