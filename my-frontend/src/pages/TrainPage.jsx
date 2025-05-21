// src/pages/TrainPage.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { trainModel } from '../lib/api';

const TrainPage = () => {
  const [files, setFiles] = useState([]);
  const [labels, setLabels] = useState([]);
  const [classNames, setClassNames] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Додаємо новий клас
  const addClass = () => setClassNames([...classNames, ""]);
  // Змінюємо назву класу
  const handleClassName = (i, val) => {
    const next = [...classNames];
    next[i] = val;
    setClassNames(next);
  };
  // Обробляємо вибір файлів та автоматично ініціалізуємо labels
  const handleFilesChange = (e, classIdx) => {
    const chosenFiles = Array.from(e.target.files).map((f) => ({
      file: f,
      classIdx,
    }));
    setFiles((fls) => [...fls, ...chosenFiles]);
    setLabels((lbs) => [
      ...lbs,
      ...Array(e.target.files.length).fill(classIdx),
    ]);
  };

  // Подаємо форму
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Додайте фото хоча б одного класу!");
      return;
    }
    // Готуємо FormData
    const formData = new FormData();
    files.forEach(({ file }) => formData.append("images", file));
    formData.append("labels", JSON.stringify(labels));
    formData.append("classnames", JSON.stringify(classNames));
    setLoading(true);
    try {
      const res = await trainModel(formData);
      setResult(res.data);
      toast.success("Тренування завершено!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Помилка тренування");
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-semibold mb-8 text-gray-900">
        Тренування моделі (класифікація зображень)
      </h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white rounded-xl shadow p-6 mb-10 space-y-6"
      >
        <h2 className="text-xl mb-2">Класи:</h2>
        {classNames.map((name, idx) => (
          <div key={idx} className="mb-4 flex items-center gap-2">
            <input
              className="border rounded p-2 flex-1"
              type="text"
              placeholder={`Назва класу #${idx + 1}`}
              value={name}
              onChange={(e) => handleClassName(idx, e.target.value)}
              required
            />
            <input
              type="file"
              accept="image/*"
              multiple
              className="border p-1"
              onChange={(e) => handleFilesChange(e, idx)}
            />
          </div>
        ))}
        <button
          type="button"
          className="bg-sky-600 text-white px-3 py-2 rounded"
          onClick={addClass}
        >
          + Додати клас
        </button>
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-3 rounded-lg font-semibold"
          >
            {loading ? "Триває навчання..." : "Запустити тренування"}
          </button>
        </div>
      </form>
      {/* Відображення результатів */}
      {result && (
        <div className="max-w-2xl w-full bg-white p-6 rounded shadow space-y-6">
          <h2 className="text-xl font-bold text-center mb-4">Результати:</h2>
          <div className="text-lg">
            Точність CNN:{" "}
            <span className="font-bold">
              {(result.cnn_accuracy * 100).toFixed(2)}%
            </span>
          </div>
          <div className="text-lg">
            Точність Logistic Regression:{" "}
            <span className="font-bold">
              {(result.logistic_accuracy * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainPage;
