// Оновлено з FeatureTable.jsx :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}
import React from 'react';

const FeatureTable = ({ features, miScores }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Feature Importance</h3>
      <table className="min-w-full">
        <thead className="bg-indigo-50">
          <tr>
            <th className="text-left px-4 py-2 text-gray-700">Feature</th>
            <th className="text-left px-4 py-2 text-gray-700">MI Score</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr
              key={idx}
              className={idx % 2 === 0 ? 'bg-gray-50' : ''}
            >
              <td className="px-4 py-2 text-gray-800">{feature}</td>
              <td className="px-4 py-2 text-gray-800">{miScores[idx].toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeatureTable;
