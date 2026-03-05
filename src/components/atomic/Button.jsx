import React from 'react';

// Button Component
const Button = ({ children, variant = 'primary', size = 'md', icon, onClick, className = '' }) => {
  const variants = {
    primary: 'bg-amber-800 hover:bg-amber-900 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button 
      onClick={onClick}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all flex items-center gap-2 justify-center ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;