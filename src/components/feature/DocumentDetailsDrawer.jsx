import React, { useEffect, useState } from 'react';
import { FileText, X, CheckCircle, Calendar, Download, Trash2 } from 'lucide-react';
import useWebSocketStatus from '../../hooks/useWebSocketStatus';
import ProgressPill from './ProgressPill';

const DocumentDetailsDrawer = ({ doc, onClose, onApprove, onDelete }) => {
  const { subscribeToDocument, statusUpdates } = useWebSocketStatus();
  const [localDoc, setLocalDoc] = useState(doc);

  // Keep localDoc in sync with incoming doc prop
  useEffect(() => {
    setLocalDoc(doc);
  }, [doc]);

  const [processingStages, setProcessingStages] = useState([
    {
      name: 'Loading',
      status: 'loading',
      // timestamp: localDoc.uploadedAt || localDoc.uploaded || new Date().toLocaleString(),
      completed: true,
      error: null
    },
    {
      name: 'Text Extraction',
      status: 'extracting',
      // timestamp: null,
      completed: localDoc.status === 'completed' || localDoc.status === 'storing' || localDoc.status === 'chunking' || localDoc.status === 'extracting',
      error: null
    },
    {
      name: 'Chunking',
      status: 'chunking',
      // timestamp: null,
      completed: localDoc.status === 'completed' || localDoc.status === 'storing' || localDoc.status === 'chunking',
      error: null
    },
    {
      name: 'Storing',
      status: 'storing',
      // timestamp: null,
      completed: localDoc.status === 'completed' || localDoc.status === 'storing',
      error: null
    }
  ]);

  // Subscribe to WebSocket updates for this document - SINGLE source of truth
  useEffect(() => {
    if (!localDoc?.id) return;

    const unsubscribe = subscribeToDocument(localDoc.id, (wsData) => {
      // Update processing stages based on WebSocket status - ONLY place where setProcessingStages is called
      // Use 'state' if available, otherwise fall back to 'status'
      const wsStatus = wsData.state || wsData.status;
      const errorMessage = wsData.message || null;

      console.log(`[DocumentDetailsDrawer] WebSocket update for ${localDoc.id}: ${wsStatus}, message: ${errorMessage}`);

      // Update local document state with WebSocket data
      setLocalDoc(prev => ({
        ...prev,
        status: wsStatus,
        progress: wsData.progress_percentage || prev.progress,
        // Only store error message when status is actually failed/error
        errorMessage: (wsStatus === 'failed' || wsStatus === 'error') ? (errorMessage || 'Processing failed') : null
      }));

      setProcessingStages(prev =>
        prev.map(stage => {
          let isCompleted = false;
          let stageError = null;

          if (stage.name === 'Loading') {
            isCompleted = true;
          } else if (stage.name === 'Text Extraction') {
            // Completed if overall status is beyond extracting or if current update is 'extracting' and status is 'completed'
            isCompleted = wsStatus === 'completed' || wsStatus === 'chunking' || wsStatus === 'storing' || (wsStatus === 'extracting' && wsData.status === 'completed');
            if (wsStatus === 'extracting' && (wsData.status === 'failed' || wsData.status === 'error')) stageError = errorMessage;
          } else if (stage.name === 'Chunking') {
            // Completed if overall status is beyond chunking or if current update is 'chunking' and status is 'completed'
            isCompleted = wsStatus === 'completed' || wsStatus === 'storing' || (wsStatus === 'chunking' && wsData.status === 'completed');
            if (wsStatus === 'chunking' && (wsData.status === 'failed' || wsData.status === 'error')) stageError = errorMessage;
          } else if (stage.name === 'Storing') {
            // Completed if overall status is 'completed' or if current update is 'storing' and status is 'completed'
            isCompleted = wsStatus === 'completed' || (wsStatus === 'storing' && wsData.status === 'completed');
            if (wsStatus === 'storing' && (wsData.status === 'failed' || wsData.status === 'error')) stageError = errorMessage;
          }

          return {
            ...stage,
            completed: isCompleted,
            error: stageError,
            timestamp: (isCompleted && !stage.timestamp) ? new Date().toLocaleString() : stage.timestamp
          };
        })
      );
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [localDoc.id, subscribeToDocument]); // Include subscribeToDocument in dependencies


  if (!localDoc) return null;

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
      'error': 'Error',
      'loading': 'Loading'
    };

    const displayStatus = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);

    if (status === 'loading') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium">
          <CheckCircle size={14} />
          {displayStatus}
        </span>
      );
    } else if (status === 'failed' || status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-md text-sm font-medium">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'uploaded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'upload_started' || status === 'uploading') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'processing' || status === 'extracting' || status === 'chunking' || status === 'storing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 rounded-md text-sm font-medium">
        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
        {displayStatus}
      </span>
    );
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">File Details</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          {/* File Info */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-500" size={32} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {localDoc.name || 'Technical_Specifications_1.csv'}
            </h3>
            {getStatusBadge(localDoc.status || 'completed')}

            {(localDoc.status === 'failed' || localDoc.status === 'error' || localDoc.errorMessage) && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Error:</p>
                <p className="text-sm text-red-600 mt-1">{localDoc.errorMessage || 'Processing failed'}</p>
              </div>
            )}

            {/* Overall Progress */}
            {localDoc.status !== 'completed' && localDoc.status !== 'failed' && localDoc.status !== 'error' && (
              <div className="mt-6 text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall Progress</span>
                  <span className="text-xs font-bold text-gray-400">{(localDoc.progress || 0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-900 rounded-full transition-all duration-300"
                    style={{ width: `${(localDoc.progress || 0)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Metadata</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Format:</span>
                <span className="text-gray-900 font-medium">
                  {localDoc.fileType || localDoc.documentType || localDoc.type || localDoc.file_type || ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Size:</span>
                <span className="text-gray-900 font-medium">
                  {localDoc.size || localDoc.file_size || ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pages:</span>
                <span className="text-gray-900 font-medium">
                  {localDoc.pages || localDoc.page_count || ''}
                </span>
              </div>
              {/* <div className="flex justify-between items-center">
                <span className="text-gray-600">Words:</span>
                <span className="text-gray-900 font-medium">
                  {localDoc.words || ''}
                </span>
              </div> */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Language:</span>
                <span className="text-gray-900 font-medium">
                  {localDoc.language || 'English'}
                </span>
              </div>
              {/* <div className="flex justify-between items-center">
                <span className="text-gray-600">Checksum:</span>
                <span className="text-gray-900 font-mono text-xs">
                  {doc.checksum || ''}
                </span>
              </div> */}
            </div>
          </div>

          {/* Upload Information Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Upload Information</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Uploaded by:</span>
                <span className="text-gray-900 font-medium">
                  {localDoc.uploader || localDoc.uploadedBy || localDoc.userName || localDoc.user_name || localDoc.user_id || 'Emma Wilson'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Uploaded at:</span>
                <span className="text-gray-900 font-medium">
                  {localDoc.uploadedDateTime || localDoc.uploaded || localDoc.uploadedAt || localDoc.createdAt || '2026-01-06 14:57'}
                </span>
              </div>
            </div>
          </div>

          {/* Processing Stages Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <h4 className="text-sm font-semibold text-gray-900">Processing Stages</h4>
            </div>
            <div className="space-y-4">
              {processingStages.map((stage, index) => {
                // Determine if this stage is currently active
                let isActive = false;
                if (!stage.completed) {
                  if (stage.name === 'Text Extraction') isActive = localDoc.status === 'extracting';
                  if (stage.name === 'Chunking') isActive = localDoc.status === 'chunking';
                  if (stage.name === 'Storing') isActive = localDoc.status === 'storing';
                }

                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${stage.error ? 'bg-red-500 border-red-500' :
                      stage.completed ? 'bg-green-500 border-green-500' :
                        isActive ? 'bg-white border-blue-500' :
                          'bg-white border-gray-200'
                      }`}>
                      {stage.error ? (
                        <X size={12} className="text-white" />
                      ) : stage.completed ? (
                        <CheckCircle size={14} className="text-white" />
                      ) : isActive ? (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0 mt-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-sm font-semibold ${stage.error ? 'text-red-600' : 'text-gray-900'}`}>
                            {stage.name}
                          </p>
                          {/* {stage.completed && stage.timestamp && (
                            <p className="text-xs text-gray-400 mt-0.5">{stage.timestamp}</p>
                          )} */}
                          {/* {!stage.completed && !stage.error && !isActive && (
                            <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                          )} */}
                          {/* {!stage.completed && !stage.error && isActive && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">Processing</p>
                          )} */}
                        </div>
                        {isActive && (
                          <span className="text-xs font-bold text-gray-400">{(localDoc.progress || 0)}%</span>
                        )}
                      </div>

                      {isActive && (
                        <div className="mt-2 text-current p-0 bg-transparent">
                          <ProgressPill
                            status={localDoc.status}
                            progress_percentage={localDoc.progress}
                            message={null}
                          />
                        </div>
                      )}

                      {stage.error && (
                        <p className="text-xs text-red-500 mt-1">{stage.error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white space-y-3">

        <button
          onClick={() => onDelete && onDelete(doc.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
          Delete File
        </button>
      </div>
    </div>
  );
};

export default DocumentDetailsDrawer;