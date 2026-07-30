import React from 'react';
import type { Specialist } from '../../types';
import { Badge, specialistTone } from '../ui/Badge';

interface StaffCardProps {
  specialist: Specialist;
  appointmentsToday?: number;
  onEdit?: (specialist: Specialist) => void;
  onDelete?: (specialist: Specialist) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({ specialist, appointmentsToday, onEdit, onDelete }) => (
  <div className="specialist-card">
    <div className="specialist-avatar">{specialist.initials}</div>
    <div className="specialist-name">{specialist.name}</div>
    <div className="specialist-role">{specialist.role}</div>
    <div className="rating">{specialist.rating}</div>
    <div className="spec-tags">
      {specialist.categories.map(category => (
        <span className="spec-tag" key={category}>{category}</span>
      ))}
    </div>
    <Badge tone={specialistTone(specialist.status)}>{specialist.status}</Badge>
    {appointmentsToday !== undefined && (
      <div className="text-sm muted mt-sm">{appointmentsToday} cita(s) hoy</div>
    )}
    {(onEdit || onDelete) && (
      <div className="card-actions">
        {onEdit && <button className="link-edit" onClick={() => onEdit(specialist)}>Editar</button>}
        {onDelete && <button className="link-del" onClick={() => onDelete(specialist)}>Eliminar</button>}
      </div>
    )}
  </div>
);
