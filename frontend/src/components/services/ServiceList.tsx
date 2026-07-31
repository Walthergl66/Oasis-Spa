import React from 'react';
import type { Service } from '../../types';
import { EmptyState } from '../ui/Feedback';
import { ServiceCard } from './ServiceCard';

interface ServiceListProps {
  services: Service[];
  onBook: (service: Service) => void;
  detailed?: boolean;
  favorites?: string[];
  onToggleFavorite?: (service: Service) => void;
  emptyText?: string;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services, onBook, detailed = false, favorites = [], onToggleFavorite, emptyText,
}) => {
  if (services.length === 0) {
    return <EmptyState icon="✦" title="Sin servicios" text={emptyText ?? 'No hay servicios en esta categoría.'} />;
  }

  return (
    <div className="grid-services">
      {services.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          onBook={onBook}
          detailed={detailed}
          isFavorite={favorites.includes(service.name)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};
