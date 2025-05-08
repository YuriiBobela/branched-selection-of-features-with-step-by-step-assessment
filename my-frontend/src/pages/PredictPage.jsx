// src/pages/PredictPage.jsx
import React, { useState } from 'react';
import axios from 'axios';

const PredictPage = () => {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/predict`, formData);
      setPrediction(res.data.predicted_class);
    } catch (err) {
      console.error('Prediction error:', err.response?.data || err);
      alert('Не вдалося класифікувати зображення.');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Класифікація зображення</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md flex flex-col items-center">
        <input 
          type="file" 
          accept="image/*" 
          onChange={e => setFile(e.target.files[0] || null)} 
          className="mb-4"
        />
        <button 
          type="submit" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Класифікувати
        </button>
      </form>
      {prediction !== null && (
        <div className="mt-6 text-xl text-gray-800">
          Результат: <span className="font-bold">
            {prediction === 0 ? 'Гладка' : 'Шерехувата'}
          </span>
        </div>
      )}
    </div>
  );
};

export default PredictPage;
