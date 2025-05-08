import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const NavBar = () => {
  const token = useAuthStore(state => state.token);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // після виходу перенаправляємо на головну
  };

  const linkClasses = ({ isActive }) =>
    isActive 
      ? 'text-indigo-600 font-semibold mr-4' 
      : 'text-gray-800 hover:text-indigo-600 mr-4';

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      {/* Логотип / назва проєкту */}
      <Link to="/" className="text-2xl font-bold text-indigo-600">
        MyProject
      </Link>
      {/* Навігаційні посилання */}
      {token ? (
        <div>
          <NavLink to="/analysis" className={linkClasses}>
            Аналіз
          </NavLink>
          <NavLink to="/train" className={linkClasses}>
            Тренування
          </NavLink>
          <NavLink to="/predict" className={linkClasses}>
          Передбачення
          </NavLink>
          <button 
            onClick={handleLogout} 
            className="text-red-600 hover:underline"
          >
            Вийти
          </button>
        </div>
      ) : (
        <div>
          <NavLink to="/login" className={linkClasses}>
            Вхід
          </NavLink>
          <NavLink to="/register" className={linkClasses}>
            Реєстрація
          </NavLink>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
