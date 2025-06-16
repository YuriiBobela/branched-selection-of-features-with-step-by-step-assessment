import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginUser, registerUser } from '../lib/api';

const useAuthStore = create(persist(
  (set) => ({
    token: null,
    user: null,

    login: async (credentials) => {
      const res = await loginUser(credentials);
      const { token, ...user } = res.data;
      set({ token, user });

      localStorage.setItem('token', token);
    },

    register: async (credentials) => {
      const res = await registerUser(credentials);
      const { token, ...user } = res.data;
      set({ token, user });
      localStorage.setItem('token', token);
    },

    logout: () => {
      set({ token: null, user: null });
      localStorage.removeItem('token');
    }
  }),
  {
    name: 'auth-storage',
    getStorage: () => localStorage
  }
));

export default useAuthStore;
