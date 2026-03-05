import React from 'react';

const ConfirmDialog = ({ open, title, message, type = 'confirm', confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold text-gray-900">{title}</div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-700">{message}</div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          {type === 'confirm' && (
            <button onClick={onCancel} className="px-4 py-2 rounded bg-white border text-sm text-gray-700 hover:bg-gray-50">
              {cancelText}
            </button>
          )}
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-amber-800 text-white text-sm hover:bg-amber-700">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
