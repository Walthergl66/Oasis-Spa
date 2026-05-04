import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface UserProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  preference?: string;
  [key: string]: unknown;
}

export const userService = {
  getProfile: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  },

  updateProfile: async (userId: string, data: UserProfilePayload) => {
    const response = await axios.put(`${API_URL}/users/${userId}`, data);
    return response.data;
  },

  deleteAccount: async (userId: string) => {
    const response = await axios.delete(`${API_URL}/users/${userId}`);
    return response.data;
  },

  getAllServices: async () => {
    const response = await axios.get(`${API_URL}/services`);
    return response.data;
  },

  getServiceById: async (serviceId: string) => {
    const response = await axios.get(`${API_URL}/services/${serviceId}`);
    return response.data;
  },
};
