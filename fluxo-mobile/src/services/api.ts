import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://192.168.1.25:3000/api';

interface FetchOptions extends RequestInit {
  data?: any;
}

export const api = {
  async fetch(endpoint: string, options: FetchOptions = {}) {
    const token = await AsyncStorage.getItem('@fluxo_jwt');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Provide a standardized error throw if not ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    // Return parsing Promise
    return response.json();
  },

  get(endpoint: string, options?: FetchOptions) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint: string, data: any, options?: FetchOptions) {
    return this.fetch(endpoint, { ...options, method: 'POST', data });
  },

  put(endpoint: string, data: any, options?: FetchOptions) {
    return this.fetch(endpoint, { ...options, method: 'PUT', data });
  },

  delete(endpoint: string, options?: FetchOptions) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  },
};
