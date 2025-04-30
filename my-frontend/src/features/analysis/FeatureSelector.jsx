import React from 'react';

const FeatureSelector = ({ features, onSelect }) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl mb-2">Select Feature</h2>
      <select onChange={(e) => onSelect(e.target.value)} className="border p-2">
        <option value="">Select a feature</option>
        {features.map((feat, index) => (
          <option key={index} value={feat}>
            {feat}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FeatureSelector;
