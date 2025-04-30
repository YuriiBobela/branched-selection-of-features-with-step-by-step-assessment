// src/pages/Home.jsx
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Home = () => {
  const { token } = useAuthStore();

  // Якщо є токен (користувач залогінений) — перекидаємо на Dashboard
  if (token) {
    return <Navigate to="/analysis" replace />;
  }

  // Інакше — звичайний гостьовий Home
  return (
    <div className="text-center py-12 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Welcome to Analytica</h1>
      <p className="mb-6 text-gray-700">Analyze images and discover feature importance</p>
      <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg mx-2">
        Login
      </Link>
      <Link to="/register" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg mx-2">
        Register
      </Link>
    </div>
  );
};

export default Home;
