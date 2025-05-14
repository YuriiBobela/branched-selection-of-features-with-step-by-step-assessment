// src/pages/AnalysisPage.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';

const AnalysisPage = () => {
  const { state } = useLocation();
  const analysisData = state?.analysisData;
  const [note, setNote] = useState('');

  if (!analysisData) {
    return <p className="p-4 text-red-600">Немає результатів для відображення.</p>;
  }

  const {
    features_deep,
    mi_deep,
    features_classical,
    mi_classical,
    interpretations,
    metric
  } = analysisData;

  const deepData = features_deep.map((feat, i) => ({ feature: feat, mi: mi_deep[i] }));
  const classicalData = features_classical.map((feat, i) => ({ feature: feat, mi: mi_classical[i] }));

  const handleSave = () => {
    const payload = {
      features: features_deep,
      miScores: mi_deep,
      note,
      metric: metric || 'mi'
    };
    fetch('/api/analysis/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.ok ? alert('Результат збережено') : alert('Помилка при збереженні'));
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Результати аналізу ознак ({metric?.toUpperCase() || 'MI'})</h2>

      {/* Графік для класичних ознак */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Класичні ознаки</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={classicalData}>
            <XAxis dataKey="feature" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="mi" fill="#60a5fa">
              <LabelList dataKey="mi" position="top" formatter={(val) => val.toFixed(2)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Графік для deep-ознак */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Глибокі ознаки</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deepData}>
            <XAxis dataKey="feature" interval={0} angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="mi" fill="#6366f1">
              <LabelList dataKey="mi" position="top" formatter={(val) => val.toFixed(2)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Висновки */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Висновки</h3>
        {interpretations?.length > 0 ? (
          <ul className="list-disc list-inside text-gray-800">
            {interpretations.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : <p className="text-gray-600">Немає автоматичних висновків.</p>}
      </div>

      {/* Примітка та збереження */}
      <div className="bg-white p-4 rounded shadow">
        <label className="block mb-2 font-medium">Примітка:</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          placeholder="Ваш коментар..."
        />
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Зберегти результат
        </button>
      </div>
    </div>
  );
};

export default AnalysisPage;
