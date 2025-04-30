// src/components/LoadingSpinner.jsx

import React from 'react';

export const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    {/* Tailwind-показник завантаження */}
    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);
