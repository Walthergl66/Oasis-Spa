import React, { useState } from 'react';
import { errorMessage } from '../../api/http';
import { reviewsService } from '../../services/reviews.service';
import { useAppointmentsStore } from '../../store/appointmentsStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import { ErrorMessage } from '../ui/Feedback';
import { Modal } from '../ui/Modal';

/** Deja una reseña sobre una cita completada; actualiza el rating del servicio. */
export const ReviewModal: React.FC = () => {
  const appointmentId = useUIStore(state => state.reviewingId);
  const close = useUIStore(state => state.closeReview);
  const toast = useUIStore(state => state.toast);
  const reloadAppointments = useAppointmentsStore(state => state.reload);
  const reloadCatalog = useCatalogStore(state => state.load);
  const appointment = useAppointmentsStore(state => state.history.find(a => a.id === appointmentId));

  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!appointmentId || !appointment) return null;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await reviewsService.create({ appointmentId: appointmentId!, rating, text });
      toast('¡Gracias por tu reseña!');
      await Promise.all([reloadAppointments(), reloadCatalog()]);
      close();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={close}>
      <div className="modal-body">
        <div className="modal-eyebrow">TU OPINIÓN</div>
        <div className="modal-title">{appointment.serviceName}</div>
        <div className="modal-meta">Con {appointment.specialistName}</div>

        {error && <ErrorMessage message={error} />}

        <div className="field-label">¿CÓMO TE FUE?</div>
        <div className="star-picker">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              className={value <= rating ? 'on' : ''}
              onClick={() => setRating(value)}
              aria-label={`${value} estrellas`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="field-label">CUÉNTANOS TU EXPERIENCIA</div>
        <textarea
          className="notes"
          rows={4}
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="¿Qué te gustó? ¿Qué podríamos mejorar?"
        />

        <button className="btn-continue" onClick={() => void submit()} disabled={submitting || text.trim().length < 5}>
          {submitting ? 'Enviando…' : 'Publicar reseña'}
        </button>
        <button className="btn-back" onClick={close}>Ahora no</button>
      </div>
    </Modal>
  );
};
