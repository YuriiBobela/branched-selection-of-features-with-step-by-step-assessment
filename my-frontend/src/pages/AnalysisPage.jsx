// src/pages/AnalysisPage.jsx
import React, { useState } from 'react';
import UploadAndAnalyzeForm from '../components/UploadAndAnalyzeForm';
import FeatureTable from '../components/FeatureTable';
import MiScoreChart from '../components/MiScoreChart';
import toast from 'react-hot-toast';

const AnalysisPage = () => {
  const [result, setResult] = useState(null);

  const handleResult = data => {
    if (data.error) {
      toast.error(data.error);
      setResult(null);
    } else {
      setResult(data);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-12 px-4">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
        Аналіз ознак
      </h1>

      <div className="w-full max-w-2xl">
        <UploadAndAnalyzeForm onResult={handleResult} />
      </div>

      {/* render only if we have proper arrays */}
      {Array.isArray(result?.features) && Array.isArray(result?.mi_scores) && (
        <div className="w-full max-w-4xl mt-12 space-y-12">
          <FeatureTable
            features={result.features}
            miScores={result.mi_scores}
          />
          <MiScoreChart
            data={result.features.map((f, i) => ({
              feature: f,
              mi: result.mi_scores[i],
            }))}
          />
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
