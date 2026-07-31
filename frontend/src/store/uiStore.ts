/** Estado de interfaz: modal de reserva, chat de Luna, avisos y menú lateral. */
import { create } from 'zustand';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  chatOpen: boolean;
  toggleChat: () => void;
  closeChat: () => void;

  /** Servicio para el que se abrió el asistente de reserva. */
  bookingServiceId: string | null;
  /** Cita que se está reprogramando (null = reserva nueva). */
  reschedulingId: string | null;
  openBooking: (serviceId: string) => void;
  openReschedule: (appointmentId: string, serviceId: string) => void;
  closeBooking: () => void;

  /** Cita que se está reseñando. */
  reviewingId: string | null;
  openReview: (appointmentId: string) => void;
  closeReview: () => void;

  toasts: Toast[];
  toast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIStore>(set => ({
  sidebarOpen: true,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  chatOpen: false,
  toggleChat: () => set(state => ({ chatOpen: !state.chatOpen })),
  closeChat: () => set({ chatOpen: false }),

  bookingServiceId: null,
  reschedulingId: null,
  openBooking: serviceId => set({ bookingServiceId: serviceId, reschedulingId: null }),
  openReschedule: (appointmentId, serviceId) => set({ bookingServiceId: serviceId, reschedulingId: appointmentId }),
  closeBooking: () => set({ bookingServiceId: null, reschedulingId: null }),

  reviewingId: null,
  openReview: appointmentId => set({ reviewingId: appointmentId }),
  closeReview: () => set({ reviewingId: null }),

  toasts: [],
  toast: (message, type = 'success') => {
    const id = ++toastId;
    set(state => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })), 4000);
  },
  dismissToast: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));
