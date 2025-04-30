// Оновлено з Navbar.jsx :contentReference[oaicite:6]{index=6}&#8203;:contentReference[oaicite:7]{index=7}
import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
  const { user, logout } = useAuthStore();

  const linkClass = ({ isActive }) =>
    `mx-3 font-medium ${
      isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
    }`;

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold text-indigo-600">
          Analytica
        </NavLink>
        <div className="flex items-center">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          {user ? (
            <> 
              <NavLink to="/analysis" className={linkClass}>
                Analysis
              </NavLink>
              <NavLink to="/about" className={linkClass}>
                About
              </NavLink>
              <button
                onClick={logout}
                className="ml-4 text-red-500 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
