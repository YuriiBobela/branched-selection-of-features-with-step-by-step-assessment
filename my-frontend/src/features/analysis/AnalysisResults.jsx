import React from 'react';

const AnalysisResults = ({ results }) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl">Analysis Results</h2>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};

export default AnalysisResults;
