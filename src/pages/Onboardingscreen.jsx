import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageHeader from '../components/layout/PageHeader';
import UploadZone from '../components/feature/UploadZone';
import Card from '../components/atomic/Card';
import Button from '../components/atomic/Button';
import DocumentCard from '../components/feature/DocumentCard';
import { Upload, FileText, Search, Filter, Activity, List, Grid, ChevronLeft, ChevronRight, Trash2, Check } from 'lucide-react';
import DocumentDetailsDrawer from '../components/feature/DocumentDetailsDrawer';
import { processDocument, deleteDocumentByBody } from '../integration/api';
import ConfirmDialog from '../components/atomic/ConfirmDialog';
import useWebSocketStatus from '../hooks/useWebSocketStatus';
import ProgressPill from '../components/feature/ProgressPill';
import ErrorNotification from '../components/feature/ErrorNotification';

const OnboardingScreen = ({ documents, onUpload, onApprove, isLoading, hasApiError, onRetry, currentUser, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDocId, setConfirmDocId] = useState(null);
  const [confirmType, setConfirmType] = useState('confirm');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [processingError, setProcessingError] = useState(null); // { message, stage, docId }

  const { isConnected, statusUpdates } = useWebSocketStatus();

  const handleUploadWithOptimistic = useCallback((files, tag, user, language) => {
    if (onUpload) onUpload(files, tag, user, language);
  }, [onUpload]);



  // Use actual documents data or empty array - only show active documents
  // Memoize to prevent recalculation on every render
  const allDocuments = useMemo(() => {
    // Then apply WebSocket updates to backend documents
    return (documents || []).filter(doc => doc.is_active === true).map(doc => {
      // Find WebSocket update by id or fallback to filename matching
      let wsStatus = statusUpdates[doc.id];

      if (!wsStatus && (doc._isOptimistic || doc._originalName)) {
        const fileName = doc._originalName || doc.name;
        const filenameKey = `filename_${fileName}`;
        wsStatus = statusUpdates[filenameKey];

        if (!wsStatus) {
          wsStatus = Object.values(statusUpdates).find(update =>
            update.file_name === fileName ||
            update.filename === fileName ||
            update.name === fileName
          );
        }
      }

      if (wsStatus) {
        // If the backend already considers this document completed/failed, 
        // don't let intermediate stage messages (e.g., storing/completed) flip it back to Processing.
        if (['completed', 'failed', 'error'].includes(doc.status) && wsStatus.status !== 'failed' && wsStatus.status !== 'error') {
          return doc;
        }

        let actualState = wsStatus.state || wsStatus.status;
        if (wsStatus.state === 'uploading') {
          if (wsStatus.status === 'started') actualState = 'upload_started';
          else if (wsStatus.status === 'processing') actualState = 'uploading';
          else if (wsStatus.status === 'completed') actualState = 'uploaded';
        } else if (wsStatus.state === 'completed' && wsStatus.status === 'completed') {
          actualState = 'completed';
        } else if (wsStatus.status === 'failed' || wsStatus.status === 'error') {
          actualState = wsStatus.status;
        } else if (wsStatus.status === 'completed' && wsStatus.state) {
          // If a stage is done but global process isn't 'completed' yet, stay in 'Processing'
          actualState = wsStatus.state;
        }

        // Only update if status or progress has actually changed
        const uploadStates = ['upload_started', 'uploading', 'uploaded'];
        const isUploadState = uploadStates.includes(doc.status);

        // Don't override upload states with processing until upload is complete
        if (isUploadState && (actualState === 'processing' || actualState === 'extracting') && doc.status !== 'uploaded') {
          return { ...doc, _wsStatus: wsStatus };
        }

        const hasWsUpdate = doc.status !== actualState || doc.progress !== wsStatus.progress_percentage;

        if (hasWsUpdate) {
          return {
            ...doc,
            status: actualState,
            progress: wsStatus.progress_percentage,
            _wsStatus: wsStatus
          };
        }

        return {
          ...doc,
          _wsStatus: wsStatus
        };
      }
      return doc;
    });
  }, [documents, statusUpdates]);
  const totalItems = allDocuments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = allDocuments.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    // Map statuses to user-friendly labels
    const statusLabels = {
      // Upload phase (explicitly mapping for state: uploading)
      'upload_started': 'Upload Started',
      'uploading': 'Uploading',
      'uploaded': 'Uploaded',
      // Processing phase (post-approve)
      'extracting': 'Processing',
      'chunking': 'Processing',
      'storing': 'Processing',
      'processing': 'Processing',
      'completed': 'Completed',
      'failed': 'Failed',
      'error': 'Error',
      'loading': 'Loading',
    };

    const displayStatus = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);

    if (status === 'loading') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          {displayStatus}
        </span>
      );
    } else if (status === 'completed') {
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
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

  const handleApprove = async (docId) => {
    // backward-compatible quick approve (not used when confirmation is enabled)
    try {
      if (onApprove && typeof onApprove === 'function') {
        onApprove(docId);
      } else {
        await processDocument(docId);
      }
    } catch (error) {
      console.error('Error processing document:', error);
    }
  };

  const handleApproveClick = useCallback((docId) => {
    setConfirmDocId(docId);
    setConfirmAction('approve');
    setConfirmType('confirm');
    setConfirmTitle('Approve document');
    setConfirmMessage('Are you sure you want to approve this document? This will start processing.');
    setConfirmOpen(true);
  }, []);

  const onConfirmApprove = useCallback(async () => {
    setConfirmOpen(false);
    if (!confirmDocId) return;

    try {
      if (onApprove && typeof onApprove === 'function') {
        onApprove(confirmDocId);
      } else {
        await processDocument(confirmDocId);
      }
      setConfirmType('info');
      setConfirmTitle('Approved');
      setConfirmMessage('Document approval started.');
      setConfirmOpen(true);
      setConfirmDocId(null);
      setConfirmAction(null);
    } catch (error) {
      console.error('Approve failed:', error);
      // Show error without alert - let WebSocket error handler manage it
      setConfirmDocId(null);
      setConfirmAction(null);
    }
  }, [confirmDocId, onApprove]);

  const handleDelete = useCallback((docId) => {
    setConfirmDocId(docId);
    setConfirmAction('delete');
    setConfirmType('confirm');
    setConfirmTitle('Move to archive');
    setConfirmMessage('This document will be moved to archive. After 30 days it will be deleted permanently.');
    setConfirmOpen(true);
  }, []);

  const openDetails = useCallback((doc) => {
    setSelectedDoc(doc);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedDoc(null);
  }, []);

  // Keep selectedDoc in sync with real-time updates from allDocuments
  useEffect(() => {
    if (selectedDoc) {
      const updatedDoc = allDocuments.find(d => d.id === selectedDoc.id);
      if (updatedDoc && (updatedDoc.status !== selectedDoc.status || updatedDoc.progress !== selectedDoc.progress)) {
        setSelectedDoc(updatedDoc);
      }
    }
  }, [allDocuments, selectedDoc]);

  const onConfirmDelete = useCallback(async () => {
    setConfirmOpen(false);
    if (!confirmDocId) return;

    try {
      // Call the backend delete API
      await deleteDocumentByBody(confirmDocId);

      // Update local state immediately for better UX
      if (typeof onDelete === 'function') {
        onDelete(confirmDocId);
      }

      setConfirmType('info');
      setConfirmTitle('Archived');
      setConfirmMessage('Document moved to archive successfully.');
      setConfirmOpen(true);
      setConfirmDocId(null);
      setConfirmAction(null);
    } catch (error) {
      console.error('Delete failed:', error);
      // Show error as notification instead of alert
      setProcessingError({
        message: error.message || 'Failed to archive document',
        stage: 'Deletion',
        docId: confirmDocId
      });
      setConfirmDocId(null);
      setConfirmAction(null);
    }
  }, [confirmDocId, onDelete]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <PageHeader
        title="Onboarding"

        actions={
          <Button
            variant="primary"
            icon={<Upload size={20} />}
            className="flex items-center gap-2"
          >
            Upload History
          </Button>
        }
      />

      {/* Upload Zone */}
      <div className="mb-6">
        <UploadZone onUpload={handleUploadWithOptimistic} currentUser={currentUser} />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by file name or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-800 focus:border-amber-800 bg-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white">
            <Filter size={18} />
            <span className="text-sm font-medium">Type</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white">
            <Activity size={18} />
            <span className="text-sm font-medium">Status</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 border border-gray-300 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amber-800 text-white' : 'bg-white hover:bg-gray-50'
              }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 border border-gray-300 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-amber-800 text-white' : 'bg-white hover:bg-gray-50'
              }`}
          >
            <Grid size={18} />
          </button>
        </div>
      </div>

      {/* Documents Display */}
      {isLoading ? (
        <Card>
          <div className="text-center py-12 text-gray-600">Loading documents...</div>
        </Card>
      ) : hasApiError ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-yellow-800 mb-4">Unable to load documents</div>
            <Button variant="primary" onClick={onRetry}>Retry</Button>
          </div>
        </Card>
      ) : currentDocuments && currentDocuments.length > 0 ? (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {currentDocuments.map((doc) => {
                const wsStatus = doc._wsStatus; // Use the merged status from the document object
                return (
                  <div key={doc.id}>
                    <DocumentCard
                      doc={doc}
                      onApprove={handleApproveClick}
                      onDelete={handleDelete}
                    />
                    <ProgressPill
                      status={doc.status}
                      progress_percentage={doc.progress || (doc._wsStatus?.progress_percentage)}
                      message={doc._wsStatus?.message}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'list' && (
            <Card className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">File Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentDocuments.map((doc) => {
                      const wsStatus = doc._wsStatus; // Use the merged status from the document object
                      return (
                        <React.Fragment key={doc.id}>
                          <tr onClick={() => openDetails(doc)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <FileText size={18} className="text-gray-400" />
                                <span className="text-sm text-gray-900 font-medium">{doc.name || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">{doc.size || '—'}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{doc.fileType || doc.type || '—'}</td>
                            <td className="py-4 px-4">
                              {getStatusBadge(doc.status || 'Unknown')}
                            </td>
                            <td className="py-4 pr-6">
                              <ProgressPill
                                status={doc.status}
                                progress_percentage={doc.progress || (doc._wsStatus?.progress_percentage)}
                                message={null}
                              />
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">{typeof doc.uploader === 'string' ? doc.uploader : typeof doc.uploadedBy === 'string' ? doc.uploadedBy : 'Unknown'}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{doc.uploadedDateTime || doc.uploaded || doc.uploadedAt || '—'}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} className="text-gray-400 hover:text-red-600" />
                                </button>
                                {doc.status === 'uploaded' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleApproveClick(doc.id); }}
                                    className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                    title="Approve document"
                                  >
                                    <Check size={16} className="text-green-600 hover:text-green-800" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}</span>
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                  >
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                    <option value={18}>18</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded ${currentPage === pageNum
                        ? 'bg-amber-800 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
          <ConfirmDialog
            open={confirmOpen}
            title={confirmTitle}
            message={confirmMessage}
            type={confirmType}
            confirmText={
              confirmType === 'confirm'
                ? (confirmAction === 'approve' ? 'Approve' : confirmAction === 'delete' ? 'Delete' : 'OK')
                : 'Close'
            }
            cancelText="Cancel"
            onConfirm={
              confirmType === 'confirm'
                ? (confirmAction === 'approve' ? onConfirmApprove : onConfirmDelete)
                : () => setConfirmOpen(false)
            }
            onCancel={() => {
              setConfirmOpen(false);
              setConfirmDocId(null);
              setConfirmAction(null);
            }}
          />

          {selectedDoc && (
            <DocumentDetailsDrawer
              doc={selectedDoc}
              onClose={closeDetails}
              onApprove={() => handleApproveClick(selectedDoc.id)}
              onDelete={() => handleDelete(selectedDoc.id)}
            />
          )}

          {processingError && (
            <ErrorNotification
              message={processingError.message}
              stage={processingError.stage}
              onClose={() => setProcessingError(null)}
              autoClose={true}
            />
          )}
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No documents available
          </div>
        </Card>
      )}
    </div>
  );
};

export default OnboardingScreen;