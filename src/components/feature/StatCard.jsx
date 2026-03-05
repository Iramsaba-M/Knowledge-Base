import React from 'react';
import Card from '../atomic/Card';

// Stat Card Component
const StatCard = ({ title, value, icon, trend, color = 'blue' }) => {
  const iconColors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <Card className="bg-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;