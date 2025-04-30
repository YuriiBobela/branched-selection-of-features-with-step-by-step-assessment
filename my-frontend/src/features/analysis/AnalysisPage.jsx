import React, { useState } from 'react';
import axios from 'axios';
import FeatureTable from '../../components/FeatureTable';
import MiScoreChart from '../../components/MiScoreChart';

const AnalysisPage = () => {
  const [result, setResult] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [labels, setLabels] = useState([]);

  const handleRunAnalysis = async () => {
    const payload = { image_urls: imageUrls, labels };
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/features/calculate`, payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Analysis</h1>
      <div>
        <input 
          type="text" 
          placeholder="Image URLs (comma separated)" 
          onChange={(e) => setImageUrls(e.target.value.split(',').map(u => u.trim()))} 
          className="border p-2 w-full mb-2" 
        />
        <input 
          type="text" 
          placeholder="Labels (comma separated)" 
          onChange={(e) => setLabels(e.target.value.split(',').map(l => parseInt(l.trim())))} 
          className="border p-2 w-full mb-2" 
        />
        <button onClick={handleRunAnalysis} className="bg-blue-600 text-white px-4 py-2">Run Analysis</button>
      </div>
      {result && (
        <div className="mt-6">
          <FeatureTable features={result.features} miScores={result.mi_scores} />
          <MiScoreChart 
            data={result.features.map((f, i) => ({ feature: f, mi: result.mi_scores[i] }))} 
          />
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
