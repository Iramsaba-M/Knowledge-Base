import React from 'react';

// Activity Item Component
const ActivityItem = ({ icon, title, subtitle, time }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-slate-100 rounded-lg">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-sm text-slate-600 truncate">{subtitle}</p>
      <p className="text-xs text-slate-400 mt-1">{time}</p>
    </div>
  </div>
);

export default ActivityItem;