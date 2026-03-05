import React from 'react';

// Page Header Component
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-3">{actions}</div>}
  </div>
);

export default PageHeader;