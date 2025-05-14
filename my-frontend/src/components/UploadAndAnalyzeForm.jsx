// src/components/MultiClassUploadForm.jsx
import React, { useState } from 'react';
import { analyzeImages } from '../lib/api';
import { toast } from 'react-hot-toast';

const MultiClassUploadForm = ({ onResult }) => {
  const [classes, setClasses] = useState([{ name: '', files: [] }]);
  const [loading, setLoading] = useState(false);

  const handleClassNameChange = (index, value) => {
    const updated = [...classes];
    updated[index].name = value;
    setClasses(updated);
  };

  const handleFileChange = (index, files) => {
    const updated = [...classes];
    updated[index].files = Array.from(files);
    setClasses(updated);
  };

  const addClass = () => {
    setClasses([...classes, { name: '', files: [] }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFiles = [];
    const labels = [];

    classes.forEach((cls, idx) => {
      cls.files.forEach(file => {
        allFiles.push(file);
        labels.push(idx); // або cls.name якщо імена важливі
      });
    });

    if (allFiles.length === 0) {
      toast.error('Завантажте хоча б одне зображення');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      allFiles.forEach(file => formData.append('images', file));
      formData.append('labels', JSON.stringify(labels));
      const response = await analyzeImages(formData);
      onResult(response.data);
    } catch (e) {
      const errorMsg = e.response?.data?.error || 'Помилка аналізу';
      onResult({ error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-semibold">Завантаження фото по класах</h2>
      {classes.map((cls, idx) => (
        <div key={idx} className="border p-4 rounded-lg">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Назва класу #{idx + 1}
          </label>
          <input
            type="text"
            value={cls.name}
            onChange={(e) => handleClassNameChange(idx, e.target.value)}
            placeholder={`Наприклад: Кіт, Собака...`}
            className="w-full mb-3 border p-2 rounded"
            required
          />
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileChange(idx, e.target.files)}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">{cls.files.length} зображень вибрано</p>
        </div>
      ))}

      <button type="button" onClick={addClass} className="text-blue-600 hover:underline">
        ➕ Додати ще клас
      </button>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white w-full py-2 rounded hover:bg-indigo-700"
      >
        {loading ? 'Аналізуємо...' : 'Запустити аналіз'}
      </button>
    </form>
  );
};

export default MultiClassUploadForm;
