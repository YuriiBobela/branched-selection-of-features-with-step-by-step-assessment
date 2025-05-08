import React, { useState } from 'react';
import { selectFeatures } from '../lib/api';
import { toast } from 'react-hot-toast';

const FeatureSelection = () => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  const runFeatureSelection = async () => {
    setLoading(true);
    try {
      const res = await selectFeatures();
      const data = res.data;
      if (data.error) {
        toast.error(data.error);
        setSteps([]); 
      } else {
        setSteps(data.steps || []); 
      }
    } catch (e) {
      const msg = e.response?.data?.error || 'Помилка вибору ознак';
      toast.error(msg);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 text-center">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Покроковий вибір ознак</h1>

      {/* Кнопка запуску вибору ознак */}
      <button 
        onClick={runFeatureSelection} 
        disabled={loading}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
      >
        {loading ? 'Виконується...' : 'Запустити вибір ознак'}
      </button>

      {/* Результати покрокового вибору ознак */}
      {steps.length > 0 && (
        <div className="mt-8 max-w-2xl mx-auto text-left bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Результати вибору ознак:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-800">
            {steps.map((step, index) => (
              <li key={index}>
                Додано ознаку <span className="font-medium">{step.feature}</span> — 
                точність моделі: <span className="font-medium">{(step.accuracy * 100).toFixed(2)}%</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default FeatureSelection;
