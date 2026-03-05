import React from 'react';

// Progress Bar Component
const ProgressBar = ({ progress, label, showPercentage = true }) => (
  <div className="w-full">
    {label && (
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && <span className="text-sm text-gray-600">{progress}%</span>}
      </div>
    )}
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div 
        className="bg-amber-800 h-full rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default ProgressBar;