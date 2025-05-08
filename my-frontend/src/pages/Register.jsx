import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuthStore from '../store/useAuthStore';

const Register = () => {
  const register = useAuthStore(state => state.register);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (formData) => {
    try {
      setError('');
      await register(formData);         // викликаємо action register з zustand
      navigate('/analysis', { replace: true });
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Помилка реєстрації';
      setError(msg);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      {/* isRegister=true показує поле "Ім'я користувача" у формі */}
      <AuthForm onSubmit={handleRegister} isRegister={true} errorMessage={error} />
    </div>
  );
};

export default Register;
