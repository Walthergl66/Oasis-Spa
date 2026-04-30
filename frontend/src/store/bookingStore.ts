import { create } from 'zustand';

interface BookingData {
  serviceId: string;
  date: string;
  time: string;
  staffId?: string;
  notes?: string;
}

interface BookingStore {
  booking: BookingData | null;
  setBooking: (booking: BookingData) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set: any) => ({
  booking: null,
  setBooking: (booking: BookingData) => set({ booking }),
  clearBooking: () => set({ booking: null }),
}));
