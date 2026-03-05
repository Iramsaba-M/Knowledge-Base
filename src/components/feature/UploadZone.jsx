import React, { useState, useRef } from 'react';
import { Upload, FileText, X, UploadCloud } from 'lucide-react';
import CustomDropdown from '../atomic/Customdropdown';
import useWebSocketStatus from '../../hooks/useWebSocketStatus';
import ProgressPill from '../feature/ProgressPill';

// Upload Zone Component
// NOTE: This component does NOT manage polling/refresh logic.
// If you're seeing uploaded files disappear during processing, the fix is in
// OnboardingScreen (optimistic doc merging) and the parent's fetchDocuments
// polling interval — pause polling while any file has an in-progress status.
const UploadZone = ({ onUpload, currentUser }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({}); // Track upload progress for each file
  const fileInputRef = useRef(null);

  const { statusUpdates } = useWebSocketStatus();

  // Dummy tags
  const tagOptions = [
    { value: 'Vedas', label: 'Vedas' },
    { value: 'Upanishads', label: 'Upanishads' },
    { value: 'Puranas', label: 'Puranas' },
    { value: 'Scriptures', label: 'Scriptures' },
    { value: 'Commentaries', label: 'Commentaries' },
    { value: 'General', label: 'General' },
    { value: 'upanishat', label: 'upanishat' }
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'kn', label: 'Kannada' },
    { value: 'ta', label: 'Tamil' },
    { value: 'te', label: 'Telugu' } 
  ];

  const handleFileChange = (e) => {
    console.log('File input changed!');
    const files = Array.from(e.target.files || []);
    console.log('Selected files:', files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const triggerFileSelect = (e) => {
    console.log('Upload zone clicked!');
    e.stopPropagation();
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleUploadClick = () => {
    if (selectedFiles.length > 0 && onUpload) {
      console.log('Uploading files:', selectedFiles.map(f => f.name));

      onUpload(selectedFiles, selectedTag, currentUser, selectedLanguage);

      // Clear selections after initiating upload
      setSelectedFiles([]);
      setSelectedTag('');
      setSelectedLanguage('');
      // Reset the file input by incrementing the key
      setFileInputKey(prev => prev + 1);
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-2xl p-16 ${isDragging
          ? 'border-amber-600 bg-amber-50'
          : 'border-gray-300 hover:border-gray-400'
          } transition-colors cursor-pointer bg-gray-50`}
        onClick={triggerFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 mx-auto shadow-sm">
            <UploadCloud className="text-gray-500" size={28} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Supported formats: PDF, DOCX, TXT, CSV, JPG, PNG, MP4, MP3 
          </p>
          <button
            onClick={triggerFileSelect}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Upload
          </button>
        </div>
      </div>
      <input
        key={fileInputKey}
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png,.mp4,.mov,.avi,.mp3,.wav,audio/*,video/*"
      />

      {selectedFiles.length > 0 && (
        <div className="mt-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <p className="font-medium text-gray-900">Selected Files ({selectedFiles.length}):</p>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setSelectedTag('');
                setSelectedLanguage('');
                // Reset the file input by incrementing the key
                setFileInputKey(prev => prev + 1);
              }}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <X size={14} />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Tag Selection with Custom Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category *
              </label>
              <CustomDropdown
                value={selectedTag}
                onChange={setSelectedTag}
                options={tagOptions}
                placeholder="Choose a Category..."
                required
              />
            </div>

            {/* Language Selection with Custom Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Language *
              </label>
              <CustomDropdown
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                options={languageOptions}
                placeholder="Choose a language..."
                required
              />
            </div>
          </div>

          <ul className="space-y-2 max-h-40 overflow-y-auto mb-4">
            {selectedFiles.map((file, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={16} className="text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    {/* Show upload progress if available - match by filename */}
                    {Object.values(statusUpdates).some(update =>
                      update.file_name === file.name ||
                      update.filename === file.name ||
                      update.name === file.name
                    ) && (
                        <div className="mt-1">
                          {Object.values(statusUpdates).filter(update =>
                            update.file_name === file.name ||
                            update.filename === file.name ||
                            update.name === file.name
                          ).map((update, idx) => {
                            let actualState = update.state || update.status;
                            if (update.state === 'uploading') {
                              if (update.status === 'started') actualState = 'upload_started';
                              else if (update.status === 'processing') actualState = 'uploading';
                              else if (update.status === 'completed') actualState = 'uploaded';
                            }
                            return (
                              <ProgressPill
                                key={idx}
                                status={actualState}
                                progress_percentage={update.progress_percentage}
                                message={update.message}
                              />
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button
              onClick={handleUploadClick}
              disabled={!selectedTag || !selectedLanguage}
              className={`px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${selectedTag && selectedLanguage
                ? 'bg-amber-800 hover:bg-amber-900 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <Upload size={16} />
              {selectedFiles.some(file =>
                Object.values(statusUpdates).some(update =>
                  (update.file_name === file.name ||
                    update.filename === file.name ||
                    update.name === file.name) &&
                  (update.status === 'uploading' || update.status === 'upload_started')
                )
              ) ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setSelectedTag('');
                setSelectedLanguage('');
                // Reset the file input by incrementing the key
                setFileInputKey(prev => prev + 1);
              }}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;