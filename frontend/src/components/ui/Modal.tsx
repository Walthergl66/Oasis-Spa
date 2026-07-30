import React, { useEffect } from 'react';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Variante ancha para formularios del panel administrativo. */
  wide?: boolean;
}

/** Ventana modal: cierra con Escape, con clic fuera y bloquea el scroll de fondo. */
export const Modal: React.FC<ModalProps> = ({ onClose, children, wide = false }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className={`modal ${wide ? 'modal-wide' : ''}`.trim()} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
};
