// src/pages/Login.jsx
import React, { useState } from 'react';
import AuthForm from '../components/AuthForm';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (formData) => {
    try {
      setError('');
      await login(formData);       // кине помилку, якщо невірно
      navigate('/analysis');      // навігація — лише при успіху
    } catch (e) {
      setError(e.message);         // показуємо повідомлення в AuthForm
    }
  };

  return <AuthForm onSubmit={handleLogin} errorMessage={error} />;
};

export default Login;
