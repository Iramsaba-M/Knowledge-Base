import React from 'react';

// Card Component
const Card = ({ children, className = '', padding = 'p-6' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${padding} ${className}`}>
    {children}
  </div>
);

export default Card;