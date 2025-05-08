import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      {/* Логотип або назва системи */}
      <h1 className="text-4xl md:text-5xl font-bold text-indigo-600 mb-6">
        Система аналізу зображень
      </h1>
      {/* Опис системи */}
      <p className="text-gray-800 text-lg max-w-xl mb-8">
        Цей веб-застосунок – дипломний проєкт для аналізу зображень та вибору ознак. 
        Ви можете завантажити набір фотографій, призначити їм мітки, і система автоматично 
        виконає обчислення інформативних ознак, покроково відбере найкращі з них, навчить модель 
        класифікації та дозволить класифікувати нові зображення.
      </p>
      {/* Кнопка "Почати" */}
      <Link to="/register">
        <button className="text-xl px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow">
          Почати
        </button>
      </Link>
      {/* Посилання для користувачів, що вже мають акаунт */}
      <p className="mt-4 text-gray-700">
        Вже маєте акаунт?{' '}
        <Link to="/login" className="text-indigo-600 underline hover:text-indigo-800">
          Увійти
        </Link>
      </p>
    </div>
  );
};

export default Home;
