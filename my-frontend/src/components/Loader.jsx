import React from 'react';

const Loader = ({ small = false }) => {
  const sizeClasses = small ? 'w-6 h-6 border-2' : 'w-12 h-12 border-4';
  return (
    <div 
      className={`${sizeClasses} border-indigo-600 border-t-transparent border-solid rounded-full animate-spin`}
      role="status" 
      aria-label="loading"
    />
  );
};

export default Loader;
