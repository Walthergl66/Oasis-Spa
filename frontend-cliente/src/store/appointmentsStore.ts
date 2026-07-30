/** Citas de la clienta autenticada: próximas, historial y acciones sobre ellas. */
import { create } from 'zustand';
import { errorMessage } from '../api/http';
import { appointmentsService } from '../services/appointments.service';
import type { Appointment } from '../types';

interface AppointmentsStore {
  clientId: string | null;
  upcoming: Appointment[];
  history: Appointment[];
  loading: boolean;
  error: string | null;
  load: (clientId: string) => Promise<void>;
  reload: () => Promise<void>;
  cancel: (appointmentId: string) => Promise<void>;
}

export const useAppointmentsStore = create<AppointmentsStore>((set, get) => ({
  clientId: null,
  upcoming: [],
  history: [],
  loading: false,
  error: null,

  load: async clientId => {
    set({ loading: true, error: null, clientId });
    try {
      const [upcoming, history] = await Promise.all([
        appointmentsService.getUpcoming(clientId),
        appointmentsService.getHistory(clientId),
      ]);
      set({ upcoming, history, loading: false });
    } catch (error) {
      set({ loading: false, error: errorMessage(error) });
    }
  },

  reload: async () => {
    const { clientId, load } = get();
    if (clientId) await load(clientId);
  },

  cancel: async appointmentId => {
    await appointmentsService.cancel(appointmentId);
    await get().reload();
  },
}));
