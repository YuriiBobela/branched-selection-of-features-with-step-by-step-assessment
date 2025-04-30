// Оновлено з Sidebar.jsx :contentReference[oaicite:8]{index=8}&#8203;:contentReference[oaicite:9]{index=9}
import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const linkClass = ({ isActive }) =>
    `block mb-3 px-4 py-2 rounded-lg ${
      isActive
        ? 'bg-indigo-100 text-indigo-600'
        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
    }`;

  return (
    <aside className="w-64 bg-white shadow-md p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
      <NavLink to="/dashboard" className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/analysis" className={linkClass}>
        Analysis
      </NavLink>
      <NavLink to="/upload" className={linkClass}>
        Uploads
      </NavLink>
    </aside>
  );
};

export default Sidebar;
