import React, { useState } from 'react';
import UploadAndAnalyzeForm from '../components/UploadAndAnalyzeForm';
import FeatureTable from '../components/FeatureTable';
import MiScoreChart from '../components/MiScoreChart';
import { toast } from 'react-hot-toast';

const Analysis = () => {
  const [result, setResult] = useState(null);

  // Обробник отримання результату аналізу з дочірнього компонента
  const handleResult = (data) => {
    if (data.error) {
      toast.error(data.error);
      setResult(null);
    } else {
      setResult(data);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Аналіз ознак</h1>

      {/* Форма завантаження зображень та запуску аналізу */}
      <div className="w-full max-w-lg">
        <UploadAndAnalyzeForm onResult={handleResult} />
      </div>

      {/* Відображення результатів аналізу: таблиця MI та графік MI */}
      {Array.isArray(result?.features) && Array.isArray(result?.mi_scores) && (
        <div className="w-full max-w-4xl mt-12 space-y-12">
          <FeatureTable features={result.features} miScores={result.mi_scores} />
          <MiScoreChart 
            data={result.features.map((feat, i) => ({
              feature: feat,
              mi: result.mi_scores[i]
            }))}
          />
        </div>
      )}
    </div>
  );
};

export default Analysis;
