import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const bookingService = {
  createBooking: async (bookingData: any) => {
    const response = await axios.post(`${API_URL}/bookings`, bookingData);
    return response.data;
  },

  getUserBookings: async (userId: string) => {
    const response = await axios.get(`${API_URL}/bookings/user/${userId}`);
    return response.data;
  },

  getBookingById: async (bookingId: string) => {
    const response = await axios.get(`${API_URL}/bookings/${bookingId}`);
    return response.data;
  },

  updateBooking: async (bookingId: string, data: any) => {
    const response = await axios.put(`${API_URL}/bookings/${bookingId}`, data);
    return response.data;
  },

  cancelBooking: async (bookingId: string) => {
    const response = await axios.delete(`${API_URL}/bookings/${bookingId}`);
    return response.data;
  },
};
