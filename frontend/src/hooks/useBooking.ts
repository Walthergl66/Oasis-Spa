import { useBookingStore } from '../store/bookingStore';

export const useBooking = () => {
  const { booking, setBooking, clearBooking } = useBookingStore();

  return {
    booking,
    setBooking,
    clearBooking,
  };
};
