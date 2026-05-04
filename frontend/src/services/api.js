const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(path, options = {}) {
  const { fallback, headers, ...requestOptions } = options;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('application/json') ? response.json() : response.text();
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}

export const api = {
  health: () => apiRequest('/', { fallback: 'Backend no expone modulos de negocio; usando datos simulados.' }),
  getAppointments: (fallback) => apiRequest('/appointments', { fallback }),
  updateAppointment: (id, payload, fallback) =>
    apiRequest(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload), fallback }),
  deleteAppointment: (id, fallback) => apiRequest(`/appointments/${id}`, { method: 'DELETE', fallback }),
  getUsers: (fallback) => apiRequest('/users', { fallback }),
  createPromotion: (payload, fallback) =>
    apiRequest('/promotions', { method: 'POST', body: JSON.stringify(payload), fallback }),
  createBooking: (payload, fallback) =>
    apiRequest('/bookings', { method: 'POST', body: JSON.stringify(payload), fallback }),
};
