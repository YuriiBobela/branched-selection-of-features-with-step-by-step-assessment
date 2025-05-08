import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MiScoreChart = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Графік MI</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="feature" tick={{ fill: '#4b5563' }} />
          <YAxis tick={{ fill: '#4b5563' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }} 
          />
          <Bar dataKey="mi" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiScoreChart;
