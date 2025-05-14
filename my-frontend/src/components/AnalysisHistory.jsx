// frontend/src/components/AnalysisHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalysisPage from './AnalysisPage';  // можна використовувати для перегляду збереженого аналізу

function AnalysisHistory() {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]); // масив обраних для порівняння (макс 2)
  const navigate = useNavigate();

  useEffect(() => {
    // Отримуємо історію аналізів при завантаженні компонента
    fetch('/api/analysis-history', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    })
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error('Помилка завантаження історії:', err));
  }, []);

  // Обробник вибору аналізу для порівняння
  const toggleSelect = (analysisId) => {
    setSelected(prev => {
      // Якщо вже вибрано - знімаємо вибір, якщо ні - додаємо (до двох)
      if (prev.includes(analysisId)) {
        return prev.filter(id => id !== analysisId);
      } else {
        if (prev.length >= 2) {
          // Якщо вже вибрано 2, не дозволяємо більше (або можна замінити останній)
          return prev;
        }
        return [...prev, analysisId];
      }
    });
  };

  // Обробник натискання "Порівняти вибрані"
  const handleCompare = () => {
    if (selected.length === 2) {
      // Знаходимо обрані два аналізи з масиву history
      const analysis1 = history.find(item => item._id === selected[0]);
      const analysis2 = history.find(item => item._id === selected[1]);
      // Передаємо дані обох аналізів на сторінку порівняння (через state або global store)
      navigate('/analysis-comparison', { state: { analysis1, analysis2 } });
    } else {
      alert('Оберіть два аналізи для порівняння.');
    }
  };

  // Обробник перегляду окремого аналізу
  const handleView = (analysis) => {
    // Можна використати навігацію на окрему сторінку перегляду
    navigate(`/analysis/${analysis._id}`, { state: { analysis } });
    // Альтернативно, можна відобразити компонент AnalysisPage в модальному вікні або на цій же сторінці
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Історія аналізів</h2>
      {history.length === 0 ? (
        <p className="text-gray-600">Немає збережених результатів аналізу.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b">Дата</th>
                <th className="px-4 py-2 border-b">Примітка</th>
                <th className="px-4 py-2 border-b">Дії</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => {
                // Форматуємо дату у зрозумілий формат
                const dateStr = new Date(item.createdAt).toLocaleString();
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{dateStr}</td>
                    <td className="px-4 py-2 border-b">{item.note || '—'}</td>
                    <td className="px-4 py-2 border-b">
                      <button 
                        onClick={() => handleView(item)} 
                        className="text-blue-600 hover:underline mr-4"
                        title="Переглянути деталі аналізу"
                      >
                        Переглянути
                      </button>
                      <label className="inline-flex items-center mr-2">
                        <input 
                          type="checkbox" 
                          className="form-checkbox" 
                          checked={selected.includes(item._id)} 
                          onChange={() => toggleSelect(item._id)} 
                        />
                        <span className="ml-2">Порівняти</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Кнопка для порівняння вибраних аналізів */}
          <div className="mt-4">
            <button 
              onClick={handleCompare} 
              className={`px-4 py-2 rounded ${selected.length === 2 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
              title="Оберіть 2 аналізи зі списку, щоб порівняти"
            >
              Порівняти вибрані
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisHistory;
