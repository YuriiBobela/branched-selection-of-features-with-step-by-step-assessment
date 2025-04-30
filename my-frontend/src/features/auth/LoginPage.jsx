import React from 'react';
import AuthForm from '../../components/AuthForm';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (data) => {
    await login(data);
    navigate('/dashboard');
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <AuthForm onSubmit={handleLogin} />
    </div>
  );
};

export default LoginPage;
