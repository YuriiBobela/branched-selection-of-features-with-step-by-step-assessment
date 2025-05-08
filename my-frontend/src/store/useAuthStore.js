import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginUser, registerUser } from '../lib/api';

const useAuthStore = create(persist(
  (set) => ({
    token: null,
    user: null,
    // Екшен для логіну
    login: async (credentials) => {
      const res = await loginUser(credentials);
      const { token, ...user } = res.data;
      set({ token, user });
      // Зберігаємо токен окремо для інтерцептора axios
      localStorage.setItem('token', token);
    },
    // Екшен для реєстрації
    register: async (credentials) => {
      const res = await registerUser(credentials);
      const { token, ...user } = res.data;
      set({ token, user });
      localStorage.setItem('token', token);
    },
    // Екшен для виходу
    logout: () => {
      set({ token: null, user: null });
      localStorage.removeItem('token');
    }
  }),
  {
    name: 'auth-storage', // ключ для localStorage, під яким зберігається стан
    getStorage: () => localStorage
  }
));

export default useAuthStore;
