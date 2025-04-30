// src/components/UploadAndAnalyzeForm.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { analyzeImages } from '../lib/api';
import { LoadingSpinner } from './LoadingSpinner';

const CLASS_OPTIONS = [
  { value: 0, label: '0 – Гладка' },
  { value: 1, label: '1 – Шерехувата' },
  // додайте свої класи за потреби
];

const UploadAndAnalyzeForm = ({ onResult }) => {
  const [files, setFiles]     = useState([]);
  const [labels, setLabels]   = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFilesChange = e => {
    const chosen = Array.from(e.target.files);
    setFiles(chosen);
    setLabels(new Array(chosen.length).fill(''));
  };

  const handleLabelChange = (idx, value) => {
    setLabels(prev => {
      const copy = [...prev];
      copy[idx] = Number(value);
      return copy;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (files.length === 0 || labels.some(l => l === '')) {
      toast.error('Будь ласка, виберіть файли й призначте їм класи');
      return;
    }

    const form = new FormData();
    files.forEach(f => form.append('images', f));
    form.append('labels', JSON.stringify(labels));

    setLoading(true);
    const toastId = toast.loading('Аналіз зображень…');

    try {
      const { data } = await analyzeImages(form);
      toast.success('Аналіз завершено!', { id: toastId });
      onResult(data);

    } catch (err) {
      // Витягуємо тіло відповіді сервера (якщо є)
      const respData = err.response?.data || {};
      console.error('UploadAndAnalyzeForm Error:', respData);

      // Формуємо повідомлення для користувача
      const serverMsg =
        respData.error ||
        respData.message ||
        JSON.stringify(respData, null, 2) ||
        'Невідома помилка';

      toast.error(serverMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-w-3xl mx-auto">
      {loading && <LoadingSpinner />}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Вибір файлів */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Виберіть зображення
          </label>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg"
            onChange={handleFilesChange}
            className="block w-full text-gray-600"
          />
        </div>

        {/* Призначення міток */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, idx) => (
              <div key={file.name} className="flex items-center space-x-4">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-20 w-20 object-cover rounded-lg border"
                />
                <select
                  value={labels[idx] ?? ''}
                  onChange={e => handleLabelChange(idx, e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="" disabled>Оберіть клас</option>
                  {CLASS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Кнопка запуску аналізу */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-6 py-3 transition disabled:opacity-50"
        >
          Запустити аналіз
        </button>
      </form>
    </div>
  );
};

export default UploadAndAnalyzeForm;
