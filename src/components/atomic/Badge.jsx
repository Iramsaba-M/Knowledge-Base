import React from 'react';

// Badge Component
const Badge = ({ children, variant = 'default', icon }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    brown: 'bg-amber-800 text-white'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${variants[variant]}`}>
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;