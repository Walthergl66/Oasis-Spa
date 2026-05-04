import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  },

  register: async (email: string, password: string, name: string) => {
    const response = await axios.post(`${API_URL}/auth/register`, { 
      email, 
      password, 
      name 
    });
    return response.data;
  },

  logout: async () => {
    return axios.post(`${API_URL}/auth/logout`);
  },

  getCurrentUser: async () => {
    const response = await axios.get(`${API_URL}/auth/me`);
    return response.data;
  },
};
