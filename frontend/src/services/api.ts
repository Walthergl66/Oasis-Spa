const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type ApiOptions = RequestInit & {
  fallback?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
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
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback as T;
    }

    throw error;
  }
}

export const api = {
  health: () => apiRequest<string>('/', { fallback: 'Backend no expone modulos de negocio; usando datos simulados.' }),
  getAppointments: <T>(fallback: T) => apiRequest<T>('/appointments', { fallback }),
  updateAppointment: <T>(id: string, payload: unknown, fallback: T) =>
    apiRequest<T>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload), fallback }),
  deleteAppointment: <T>(id: string, fallback: T) =>
    apiRequest<T>(`/appointments/${id}`, { method: 'DELETE', fallback }),
  getUsers: <T>(fallback: T) => apiRequest<T>('/users', { fallback }),
  createPromotion: <T>(payload: unknown, fallback: T) =>
    apiRequest<T>('/promotions', { method: 'POST', body: JSON.stringify(payload), fallback }),
  createBooking: <T>(payload: unknown, fallback: T) =>
    apiRequest<T>('/bookings', { method: 'POST', body: JSON.stringify(payload), fallback }),
};
