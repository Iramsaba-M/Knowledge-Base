import React from 'react';

// Input Component
const Input = ({ label, placeholder, value, onChange, type = 'text', icon, className = '' }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600 ${icon ? 'pl-10' : ''}`}
      />
    </div>
  </div>
);

export default Input;