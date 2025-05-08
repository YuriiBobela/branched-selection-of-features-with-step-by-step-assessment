import React, { useState } from 'react';
import { analyzeImages } from '../lib/api';

const UploadAndAnalyzeForm = ({ onResult }) => {
  const [files, setFiles] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Обробник вибору файлів
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  // Обробник введення міток (розділених комою)
  const handleLabelsChange = (e) => {
    const labelsArray = e.target.value.split(',').map(l => l.trim()).filter(l => l);
    setLabels(labelsArray);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Перевірка наявності файлів та відповідності кількості міток
    if (files.length === 0) {
      onResult({ error: 'Будь ласка, виберіть хоча б одне зображення.' });
      return;
    }
    if (labels.length !== files.length) {
      onResult({ error: 'Кількість міток має відповідати кількості зображень.' });
      return;
    }
    setLoading(true);
    try {
      // Формуємо FormData для відправки зображень та міток
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      formData.append('labels', JSON.stringify(labels));
      const response = await analyzeImages(formData);
      onResult(response.data);  // передаємо результат аналізу наверх
    } catch (e) {
      const errorMsg = e.response?.data?.error || 'Помилка аналізу';
      onResult({ error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Оберіть зображення
        </label>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleFileChange} 
          className="w-full text-gray-800"
        />
      </div>
      <div>
        <label className="block mb-2 font-medium text-gray-700">
          Введіть мітки (через кому)
        </label>
        <input 
          type="text" 
          onChange={handleLabelsChange} 
          className="w-full border border-gray-300 rounded-lg p-2"
          placeholder="Напр. 0, 1, 1, 0"
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py(3) px-6 flex items-center justify-center"
        disabled={loading}
      >
        {loading ? (
          // Відображення індикатора завантаження в кнопці
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Виконується...
          </div>
        ) : 'Запустити аналіз'}
      </button>
    </form>
  );
};

export default UploadAndAnalyzeForm;
