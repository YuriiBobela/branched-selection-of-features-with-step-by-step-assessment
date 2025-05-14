import React from 'react';
import UploadAndAnalyzeForm from '../components/UploadAndAnalyzeForm';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Analysis = () => {
  const navigate = useNavigate();

  const handleResult = (data) => {
    if (data.error) {
      toast.error(data.error);
    } else {
      // Перенаправляємо на сторінку результату з даними аналізу
      navigate('/analysis/result', { state: { analysisData: data } });
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Аналіз ознак</h1>
      <div className="w-full max-w-lg">
        <UploadAndAnalyzeForm onResult={handleResult} />
      </div>
    </div>
  );
};

export default Analysis;