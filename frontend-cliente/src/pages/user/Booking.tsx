import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookingForm } from '../../components/booking/BookingForm';
import { ServiceList } from '../../components/services/ServiceList';
import { Loader } from '../../components/ui/Feedback';
import { useCatalogStore } from '../../store/catalogStore';

/**
 * Página de reserva (/booking?serviceId=…). Es la alternativa a pantalla
 * completa del modal: misma lógica, mismo componente de formulario.
 */
export const Booking: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const serviceId = params.get('serviceId');
  const services = useCatalogStore(state => state.services);
  const loading = useCatalogStore(state => state.loading);
  const service = services.find(s => s.id === serviceId);
  const navigate = useNavigate();

  if (loading && services.length === 0) return <Loader />;

  if (!service) {
    return (
      <div className="page">
        <h2 className="page-title">Reservar una cita</h2>
        <p className="page-subtitle">Elige el servicio con el que quieres empezar.</p>
        <ServiceList services={services} onBook={selected => setParams({ serviceId: selected.id })} detailed />
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="page-title">Reservar {service.name}</h2>
      <p className="page-subtitle">{service.durationMin} min · ${service.price}</p>

      <div className="reservas-layout">
        <div className="panel">
          <BookingForm service={service} onDone={() => navigate('/appointments')} />
        </div>
        <div className="side-panel">
          <div className="eyebrow mb-md">✦ {service.category.toUpperCase()}</div>
          <div className="reserva-thumb" style={{ width: '100%', height: 180, marginBottom: 18 }}>
            <img src={service.image} alt={service.name} />
          </div>
          <div className="location-name">{service.name}</div>
          <div className="location-addr">{service.description}</div>
          <div className="side-block-label">UBICACIÓN</div>
          <div className="location-addr">📍 Oasis Spa · Manta, Manabí</div>
          <div className="side-block-label">HORARIO</div>
          <div className="location-addr">Lun a Sáb · 09:00 – 18:00</div>
          <div className="location-addr">Dom · 10:00 – 14:00</div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
