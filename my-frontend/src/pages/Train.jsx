import React, { useState } from 'react';
import { trainModel } from '../lib/api';
import { toast } from 'react-hot-toast';

const Train = () => {
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTraining = async () => {
    setLoading(true);
    try {
      const res = await trainModel();
      const data = res.data;
      if (data.error) {
        toast.error(data.error);
        setAccuracy(null);
      } else {
        setAccuracy(data.accuracy ?? null);
      }
    } catch (e) {
      const msg = e.response?.data?.error || 'Помилка тренування моделі';
      toast.error(msg);
      setAccuracy(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 text-center">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Тренування моделі</h1>
      {/* Кнопка запуску тренування */}
      <button 
        onClick={runTraining} 
        disabled={loading}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
      >
        {loading ? 'Виконується...' : 'Розпочати тренування'}
      </button>
      {/* Відображення фінальної точності */}
      {accuracy !== null && (
        <p className="mt-6 text-xl text-gray-800">
          Фінальна точність моделі: <span className="font-semibold">{(accuracy * 100).toFixed(2)}%</span>
        </p>
      )}
    </div>
  );
};

export default Train;
