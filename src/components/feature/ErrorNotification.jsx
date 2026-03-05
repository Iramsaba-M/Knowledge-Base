import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorNotification = ({ message, stage, onClose, autoClose = true }) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-right-4">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-red-900 text-sm">Processing Error</h3>
            {stage && (
              <p className="text-red-700 text-xs mt-1">
                <span className="font-semibold">Stage:</span> {stage}
              </p>
            )}
            {message && (
              <p className="text-red-700 text-sm mt-2">{message}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;
