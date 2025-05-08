import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const login = useAuthStore(state => state.login);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (formData) => {
    try {
      setError('');
      await login(formData);            // викликаємо action login з zustand
      navigate('/analysis', { replace: true });
    } catch (e) {
      // Отримуємо повідомлення про помилку (якщо є з бекенду)
      const msg = e.response?.data?.error || e.message || 'Помилка входу';
      setError(msg);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <AuthForm onSubmit={handleLogin} errorMessage={error} />
    </div>
  );
};

export default Login;
