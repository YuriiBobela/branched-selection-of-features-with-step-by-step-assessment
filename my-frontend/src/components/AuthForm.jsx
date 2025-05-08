import React, { useState } from 'react';

const AuthForm = ({ onSubmit, isRegister = false, errorMessage = '' }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        {isRegister ? 'Реєстрація' : 'Вхід'}
      </h2>

      {errorMessage && (
        <div className="text-red-600 bg-red-100 p-3 rounded">
          {errorMessage}
        </div>
      )}

      {/* Поле "Ім'я користувача" тільки при реєстрації */}
      {isRegister && (
        <div>
          <label className="block mb-1 text-gray-700">Ім&rsquo;я користувача</label>
          <input 
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            required 
          />
        </div>
      )}

      <div>
        <label className="block mb-1 text-gray-700">Електронна пошта</label>
        <input 
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
          required 
        />
      </div>

      <div>
        <label className="block mb-1 text-gray-700">Пароль</label>
        <input 
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
          required 
        />
      </div>

      <button 
        type="submit" 
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-6 py-3 transition"
      >
        {isRegister ? 'Зареєструватися' : 'Увійти'}
      </button>
    </form>
  );
};

export default AuthForm;
