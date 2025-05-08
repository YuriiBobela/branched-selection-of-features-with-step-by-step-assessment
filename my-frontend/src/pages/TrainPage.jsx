// src/pages/TrainPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';  // компонент зі спіннером

const TrainPage = () => {
  const [files, setFiles] = useState([]);
  const [labels, setLabels] = useState([]);
  const [finetune, setFinetune] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFilesChange = e => {
    const chosenFiles = Array.from(e.target.files);
    setFiles(chosenFiles);
    // Ініціалізуємо масив міток пустими значеннями (за кількістю файлів)
    setLabels(new Array(chosenFiles.length).fill(''));
  };

  const handleLabelChange = (idx, value) => {
    const newLabels = [...labels];
    newLabels[idx] = Number(value);
    setLabels(newLabels);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (files.length === 0 || labels.some(label => label === '')) {
      alert('Будь ласка, виберіть зображення та призначте кожному клас.');
      return;
    }
    // Формуємо form-data з файлами та мітками
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    formData.append('labels', JSON.stringify(labels));
    formData.append('finetune', finetune);  // true/false

    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/train`, formData);
      setResult(res.data);
    } catch (err) {
      console.error('Training error:', err.response?.data || err);
      alert('Сталася помилка під час тренування.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Тренування CNN-моделі</h1>

      {/* Форма завантаження даних для тренування */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Виберіть навчальні зображення:</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFilesChange} 
              className="w-full text-gray-700"
            />
          </div>

          {/* Поля вибору класу для кожного завантаженого зображення */}
          {files.map((file, idx) => (
            <div key={idx} className="mb-2 flex items-center">
              <span className="mr-4 text-gray-600">{file.name}</span>
              <select 
                value={labels[idx] ?? ''} 
                onChange={e => handleLabelChange(idx, e.target.value)} 
                className="border border-gray-300 rounded px-2 py-1"
                required
              >
                <option value="" disabled>Оберіть клас</option>
                <option value="0">0 – Гладка</option>
                <option value="1">1 – Шерехувата</option>
              </select>
            </div>
          ))}

          {/* Прапорець вибору режиму fine-tuning */}
          <div className="mb-4 mt-4">
            <label className="inline-flex items-center text-gray-800">
              <input 
                type="checkbox" 
                className="form-checkbox h-5 w-5 text-indigo-600" 
                checked={finetune} 
                onChange={e => setFinetune(e.target.checked)} 
              />
              <span className="ml-2">Тонке налаштування всієї моделі (якщо зняти – навчати лише класифікатор)</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
          >
            Запустити навчання
          </button>
        </form>
        {loading && <LoadingSpinner />}  {/* показуємо індикатор, поки триває навчання */}
      </div>

      {/* Блок результатів після тренування */}
      {result && (
        <div className="w-full max-w-4xl mt-8 space-y-8">
          {/* Графік порівняння точності */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Точність: Logistic vs CNN</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                  { method: 'Логістична регресія', accuracy: result.logistic_accuracy },
                  { method: 'CNN-модель', accuracy: result.cnn_accuracy }
                ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="method" stroke="#888" />
                <YAxis stroke="#888" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                <Bar dataKey="accuracy" fill="#4c51bf" />  {/* фіолетові стовпчики */}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Графік функції втрат по епохах */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Крива втрати під час навчання</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={result.loss_history.map((loss, i) => ({ epoch: i + 1, loss }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="epoch" stroke="#888" label={{ value: 'Епоха', position: 'insideBottomRight', offset: 0 }} />
                <YAxis stroke="#888" />
                <Tooltip />
                <Line type="monotone" dataKey="loss" stroke="#38bdf8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Графік взаємної інформації для класичних ознак */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Взаємна інформація: класичні ознаки</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.features_classical.map((feat, i) => ({ feature: feat, mi: result.mi_classical[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="feature" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Bar dataKey="mi" fill="#06b6d4" />  {/* блакитні стовпчики */}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Графік взаємної інформації для глибоких ознак (топ-10) */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Взаємна інформація: глибокі ознаки (топ-10)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.features_deep.map((feat, i) => ({ feature: feat, mi: result.mi_deep[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="feature" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Bar dataKey="mi" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainPage;
