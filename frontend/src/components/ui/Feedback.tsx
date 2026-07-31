import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { Modal } from './Modal';

/** Indicador de carga para listas y páginas. */
export const Loader: React.FC<{ text?: string }> = ({ text = 'Cargando…' }) => (
  <div className="loader">
    <span className="spinner" />
    {text}
  </div>
);

interface EmptyStateProps {
  icon?: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '🌿', title, text, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <div className="empty-title">{title}</div>
    {text && <div className="empty-text">{text}</div>}
    {action}
  </div>
);

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="form-error">{message}</div>
);

/** Avisos flotantes conectados al store de interfaz. */
export const Toaster: React.FC = () => {
  const toasts = useUIStore(state => state.toasts);
  const dismiss = useUIStore(state => state.dismissToast);

  if (toasts.length === 0) return null;
  return (
    <div className="toaster">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`} onClick={() => dismiss(toast.id)} role="status">
          <span>{toast.type === 'error' ? '⚠' : toast.type === 'info' ? 'ℹ' : '✓'}</span>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title, message, confirmLabel = 'Confirmar', cancelLabel = 'Volver',
  danger = true, loading = false, onConfirm, onCancel,
}) => (
  <Modal onClose={onCancel}>
    <div className="confirm-dialog">
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="btn-neutral" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);
