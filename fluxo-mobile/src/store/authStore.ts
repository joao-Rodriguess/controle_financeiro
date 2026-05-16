import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true, // start loading to check local storage
  error: null,

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('@fluxo_jwt');
      const userStr = await AsyncStorage.getItem('@fluxo_user');
      
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post('/auth/login', { email, password });
      
      await AsyncStorage.setItem('@fluxo_jwt', data.token);
      await AsyncStorage.setItem('@fluxo_user', JSON.stringify(data.user));
      
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao fazer login', isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post('/auth/register', { name, email, password });
      
      await AsyncStorage.setItem('@fluxo_jwt', data.token);
      await AsyncStorage.setItem('@fluxo_user', JSON.stringify(data.user));
      
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao registrar', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('@fluxo_jwt');
    await AsyncStorage.removeItem('@fluxo_user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
