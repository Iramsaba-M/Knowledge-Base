import React from 'react';
import { FileText, User, Check, Trash2 } from 'lucide-react';

// Document Card Item for Grid View
const DocumentCard = ({ doc, onApprove, onDelete }) => {
  const getStatusBadge = (status) => {
    // Map statuses to user-friendly labels
    const statusLabels = {
      'upload_started': 'Upload Started',
      'uploading': 'Uploading',
      'uploaded': 'Uploaded',
      'extracting': 'Processing',
      'chunking': 'Processing',
      'storing': 'Processing',
      'processing': 'Processing',
      'completed': 'Completed',
      'failed': 'Failed',
      'error': 'Error'
    };
    
    const displayStatus = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);
    
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'failed' || status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'uploaded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'upload_started' || status === 'uploading') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'processing' || status === 'extracting' || status === 'chunking' || status === 'storing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header with icon and status */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <FileText className="text-gray-600" size={24} />
        </div>
        {getStatusBadge(doc.status || 'Unknown')}
      </div>

      {/* File name */}
      <h3 className="text-base font-semibold text-gray-900 mb-3 truncate">
        {doc.name || 'Untitled Document'}
      </h3>

      {/* File details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Type:</span>
          <span className="text-gray-900 font-medium">{doc.fileType || doc.type || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Size:</span>
          <span className="text-gray-900 font-medium">{doc.size || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Uploaded:</span>
          <span className="text-gray-900 font-medium">
            {doc.uploadedDateTime || doc.uploaded || doc.uploadedAt || 'N/A'}
          </span>
        </div>
      </div>

      {/* Uploader */}
      <div className="flex items-center gap-2 mb-2">
        <User size={14} className="text-gray-400" />
        <span className="text-sm text-gray-600">
          {doc.uploader || doc.uploadedBy || 'Unknown'}
        </span>
      </div>

      {/* Actions */}
      {doc.status === 'uploaded' && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove && onApprove(doc.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Check size={16} />
            Approve
          </button>
          <button
            onClick={() => onDelete && onDelete(doc.id)}
            className="p-2 border border-gray-300 hover:bg-red-50 hover:border-red-300 rounded-lg transition-colors"
          >
            <Trash2 size={16} className="text-gray-600 hover:text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentCard;