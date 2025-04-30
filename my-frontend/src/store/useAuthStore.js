// src/store/useAuthStore.js
import create from 'zustand';
import { persist } from 'zustand/middleware';
import { loginUser, registerUser } from '../lib/api';

const useAuthStore = create(persist(
  (set) => ({
    token: null,
    user: null,
    login: async (data) => {
      const res = await loginUser(data);
      const { token, ...user } = res.data;
      set({ token, user });
    },
    register: async (data) => {
      const res = await registerUser(data);
      const { token, ...user } = res.data;
      set({ token, user });
    },
    logout: () => set({ token: null, user: null }),
  }),
  {
    name: 'auth-storage',      // ключ у localStorage
    getStorage: () => localStorage,
  }
));

export default useAuthStore;
