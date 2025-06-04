import React, { useState } from 'react';
import BranchedTreeD3 from '../components/BranchedTreeView';
import { toast } from 'react-hot-toast';
import { branchedFeatureSelection } from '../lib/api';
// Функція для конвертації selectionTree до формату, який приймає react-d3-tree
function toD3Tree(node, parentAcc = null) {
  const label = node.feature
    ? `${node.feature} (${(node.accuracy * 100).toFixed(1)}%)`
    : `Початок (${(node.accuracy * 100).toFixed(1)}%)`;

  let diff = parentAcc !== null
    ? ` +${((node.accuracy - parentAcc) * 100).toFixed(1)}%`
    : '';
  let name = `${label}${diff}`;

  const children = node.children
    ? node.children.map(child => toD3Tree(child, node.accuracy))
    : [];
  return {
    name,
    attributes: {
      'Додано ознаку': node.feature || '—',
      'Точність': `${(node.accuracy * 100).toFixed(2)}%`
    },
    children,
  };
}

export default function AnalysisPage() {
  const [classes, setClasses] = useState([
    { name: '', files: [] },
    { name: '', files: [] },
  ]);
  const [loading, setLoading] = useState(false);
  const [resultTree, setResultTree] = useState(null);

  // Додаємо клас
  const addClass = () => {
    setClasses([...classes, { name: '', files: [] }]);
  };

  // Змінити назву класу
  const handleName = (i, value) => {
    const updated = [...classes];
    updated[i].name = value;
    setClasses(updated);
  };

  // Додаємо зображення для класу
  const handleFiles = (i, files) => {
    const updated = [...classes];
    updated[i].files = Array.from(files);
    setClasses(updated);
  };

  // Валідація
  const validate = () => {
    if (classes.length < 2) {
      toast.error('Додайте принаймні два класи!');
      return false;
    }
    for (const cls of classes) {
      if (!cls.name.trim()) {
        toast.error('Вкажіть назву для кожного класу');
        return false;
      }
      if (!cls.files.length) {
        toast.error(`Додайте зображення для класу "${cls.name || 'без назви'}"`);
        return false;
      }
    }
    return true;
  };

  // Відправка
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      let labels = [];
      let allFiles = [];
      classes.forEach((cls, i) => {
        for (let file of cls.files) {
          allFiles.push(file);
          labels.push(i); // Індекс класу як мітка
        }
      });
      allFiles.forEach(f => formData.append('images', f));
      formData.append('labels', JSON.stringify(labels));

      // Використовуємо винесену функцію
      const res = await branchedFeatureSelection(formData);
      const data = res.data;
      if (data.error) {
        toast.error(data.error);
        setResultTree(null);
      } else {
        setResultTree(data.selectionTree);
        toast.success('Аналіз завершено!');
      }
    } catch (err) {
      toast.error('Помилка при аналізі');
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-3 text-gray-800 text-center">Відбір ознак: завантаження даних</h1>
        <p className="mb-5 text-gray-600 text-center">
          Завантажте зображення по класах. Алгоритм побудує дерево відбору ознак з покроковою оцінкою інформативності.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {classes.map((cls, idx) => (
            <div key={idx} className="bg-gray-100 p-4 rounded-xl flex flex-col gap-2 shadow">
              <label className="font-semibold text-gray-700">
                Клас {idx + 1}
                <input
                  type="text"
                  placeholder="Назва класу"
                  className="ml-2 p-2 border rounded"
                  value={cls.name}
                  onChange={e => handleName(idx, e.target.value)}
                  required
                />
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleFiles(idx, e.target.files)}
                className="p-2"
              />
              <span className="text-sm text-gray-500">
                {cls.files.length ? `${cls.files.length} файлів обрано` : 'Не обрано файлів'}
              </span>
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-medium hover:bg-blue-200"
            onClick={addClass}
          >
            + Додати клас
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? 'Обробка...' : 'Запустити аналіз ознак'}
          </button>
        </form>
      </div>
      {/* Вивід дерева */}
      {resultTree &&
  <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-xl shadow border border-indigo-100">
    <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-700">Дерево покрокового вибору ознак</h2>
    <BranchedTreeD3 data={[toD3Tree(resultTree)]} />
  </div>
}
    </div>
  );
}
