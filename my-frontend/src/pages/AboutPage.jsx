// src/pages/AboutPage.jsx
import React from 'react';

const AboutPage = () => (
  <div className="min-h-screen bg-gray-100 py-12">
    <div className="prose max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">
      <h1>Про проєкт</h1>
      <p>
        Цей веб-застосунок реалізує дипломну роботу з аналізу зображень та розгалуженого вибору ознак. 
        Ви можете завантажити пакет фотографій, призначити їм мітки, а система автоматично:
      </p>
      <ul>
        <li>Преобробить зображення (зміна розміру, конвертація в градації сірого).</li>
        <li>Витягне кольорові та текстурні ознаки (середнє RGB, стандартне відхилення яскравості).</li>
        <li>Обчислить метрику інформативності Mutual Information для кожної ознаки.</li>
      </ul>
      <h2>Технології</h2>
      <ul>
        <li><strong>Frontend:</strong> React + Vite, TailwindCSS, Zustand, React Router.</li>
        <li><strong>Backend:</strong> Express (Node.js), нестале зберігання зображень у пам'яті.</li>
        <li><strong>Python:</strong> OpenCV, NumPy, scikit-learn для обробки та аналізу.</li>
      </ul>
      <h2>Як користуватись</h2>
      <ol>
        <li>Зареєструйтесь або увійдіть у свій акаунт.</li>
        <li>Перейдіть на сторінку <em>Аналіз</em>, оберіть зображення та введіть мітки.</li>
        <li>Натисніть «Запустити аналіз» і дочекайтеся результатів.</li>
        <li>Ознайомтесь із таблицею важливості ознак та графіком MI.</li>
      </ol>
      <p className="text-gray-500 text-sm">
        © 2025 — Дипломний проєкт. Усі права захищені.
      </p>
    </div>
  </div>
);

export default AboutPage;
