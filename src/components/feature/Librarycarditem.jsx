import React from 'react';
import { FileText, Eye, Download, Folder } from 'lucide-react';

// Library Card Item for Grid View
const LibraryCardItem = ({ item }) => {
  const getFileIcon = () => {
    return (
      <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
        <FileText className="text-gray-600" size={28} />
      </div>
    );
  };

  const getStatusBadge = () => {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
        Completed
      </span>
    );
  };

  const getDisplayCategory = (it) => {
    return it.category || it.tag || it.category_name || it.categoryName || 'Unknown';
  };

  const getDisplayUser = (it) => {
    return it.userName || it.user_name || it.uploadedBy || it.uploader || it.userId || 'Unknown';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header with icon and status */}
      <div className="flex items-start justify-between mb-4">
        {getFileIcon()}
        {getStatusBadge()}
      </div>

      {/* File name */}
      <h3 className="text-base font-semibold text-gray-900 mb-4 truncate">
        {item.name || 'Untitled Document'}
      </h3>

      {/* File details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Category:</span>
          <span className="text-gray-600 font-medium flex items-center gap-1">
            {getDisplayCategory(item)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Size:</span>
          <span className="text-gray-600 font-medium">{item.size || '—'}</span>
        </div>
        {/* <div className="flex justify-between text-sm">
          <span className="text-gray-600">Views:</span>
          <span className="text-gray-900 font-medium flex items-center gap-1">
            <Eye size={14} className="text-gray-400" />
            {item.views !== undefined ? item.views : '—'}
          </span>
        </div> */}
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {item.tag ? (
          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
            {item.tag}
          </span>
        ) : (
          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-400 rounded text-xs italic">
            No tag
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium">
          <Eye size={16} />
          View
        </button>
        <button className="p-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
          <Download size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Footer - uploader and date */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        {getDisplayUser(item)} • {item.uploadedDate || item.uploaded || '—'}
      </div>
    </div>
  );
};

export default LibraryCardItem;