import React from 'react';

interface ServiceCardProps {
  name: string;
  description: string;
  price: number;
  duration: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ 
  name, 
  description, 
  price, 
  duration 
}) => {
  return (
    <div className="service-card">
      <h3>{name}</h3>
      <p>{description}</p>
      <p>Duration: {duration} min</p>
      <p>Price: ${price}</p>
    </div>
  );
};
