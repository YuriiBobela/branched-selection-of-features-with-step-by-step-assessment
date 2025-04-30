import React from 'react';
import AuthForm from '../../components/AuthForm';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const register = useAuthStore(state => state.register);
  const navigate = useNavigate();

  const handleRegister = async (data) => {
    await register(data);
    navigate('/analysis');
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <AuthForm onSubmit={handleRegister} isRegister={true} />
    </div>
  );
};

export default RegisterPage;
