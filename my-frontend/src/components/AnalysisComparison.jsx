// frontend/src/components/AnalysisComparison.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AnalysisComparison() {
  // Отримуємо передані через navigate() дані двох аналізів
  const location = useLocation();
  const { analysis1, analysis2 } = location.state || {}; 
  // Якщо дані не передані через state, тут можна зробити fetch двох аналізів за ID через API

  if (!analysis1 || !analysis2) {
    return <p className="p-4 text-red-500">Помилка: не вдалося завантажити дані для порівняння.</p>;
  }

  // Припускаємо, що analysis1.features і analysis2.features містять списки ознак.
  // Об'єднаємо дані двох аналізів по назві ознак:
  const featuresSet = new Set([...analysis1.features, ...analysis2.features]);
  const combinedData = Array.from(featuresSet).map(feature => {
    const idx1 = analysis1.features.indexOf(feature);
    const idx2 = analysis2.features.indexOf(feature);
    const mi1 = idx1 !== -1 ? analysis1.miScores[idx1] : 0;
    const mi2 = idx2 !== -1 ? analysis2.miScores[idx2] : 0;
    return {
      feature: feature,
      mi1: mi1,
      mi2: mi2,
      diff: mi2 - mi1
    };
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Порівняння двох аналізів</h2>
      {/* Графік з двома серіями (Аналіз 1 і Аналіз 2) */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-xl font-semibold mb-2">Порівняльна діаграма MI</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={combinedData}>
            <XAxis dataKey="feature" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="mi1" name="Аналіз 1" fill="#34d399" />  {/* Зелені стовпчики */}
            <Bar dataKey="mi2" name="Аналіз 2" fill="#60a5fa" />  {/* Сині стовпчики */}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Таблиця порівняння значень MI */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="text-xl font-semibold mb-2">Таблиця порівняння MI</h3>
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Ознака</th>
              <th className="px-4 py-2 border-b">MI (аналіз 1)</th>
              <th className="px-4 py-2 border-b">MI (аналіз 2)</th>
              <th className="px-4 py-2 border-b">Δ</th>
            </tr>
          </thead>
          <tbody>
            {combinedData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{item.feature}</td>
                <td className="px-4 py-2 border-b">{item.mi1.toFixed(3)}</td>
                <td className="px-4 py-2 border-b">{item.mi2.toFixed(3)}</td>
                <td className={`px-4 py-2 border-b ${item.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.diff >= 0 ? '+' : ''}{item.diff.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-gray-600 text-sm mt-2">
          Δ – різниця (MI аналізу 2 мінус MI аналізу 1) для кожної ознаки.
        </p>
      </div>
    </div>
  );
}

export default AnalysisComparison;
