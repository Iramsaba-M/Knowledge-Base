import React, { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/atomic/Card';
import Button from '../components/atomic/Button';
import LibraryCardItem from '../components/feature/Librarycarditem';
import { FileText, Video, Image as ImageIcon, Music, Presentation , TrendingUp, Search, Filter, Download, ExternalLink, Eye, List, Grid, ChevronDown, Trash2} from 'lucide-react';
import { deleteDocumentByBody } from '../integration/api';
import ConfirmDialog from '../components/atomic/ConfirmDialog';

// Content Library Screen Component
const ContentLibraryScreen = ({ documents, onViewDoc, onNavigate, isLoading, hasApiError, onRetry, onDelete }) => {
  const [viewMode, setViewMode] = useState('list'); // Start with list view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDocId, setConfirmDocId] = useState(null);
  const [confirmType, setConfirmType] = useState('confirm');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Transform actual documents if available
  const transformedDocuments = documents && Array.isArray(documents) 
    ? documents // Documents are already transformed by the API layer
    : [];



  const libraryItems = transformedDocuments;

  // Only show items with completed status
  const displayedItems = libraryItems.filter(item => {
    const status = (item.status || '').toString().toLowerCase();
    return status === 'completed';
  });

  // Calculate statistics from displayed (completed) documents with flexible type matching
  const documentCount = displayedItems.filter(item => {
    const type = (item.type || '').toLowerCase();
    return type.includes('pdf') || type.includes('doc') || type.includes('txt') || 
           type.includes('xls') || type.includes('csv') || type.includes('rtf') ||
           (item.name && item.name.toLowerCase().includes('.pdf')) ||
           (item.name && item.name.toLowerCase().includes('.doc')) ||
           (item.name && item.name.toLowerCase().includes('.txt'));
  }).length;
  
  const videoCount = displayedItems.filter(item => {
    const type = (item.type || '').toLowerCase();
    return type.includes('mp4') || type.includes('avi') || type.includes('mov') || 
           type.includes('wmv') || type.includes('flv') || type.includes('webm') ||
           (item.name && item.name.toLowerCase().includes('.mp4')) ||
           (item.name && item.name.toLowerCase().includes('.avi')) ||
           (item.name && item.name.toLowerCase().includes('.mov'));
  }).length;
  
  const imageCount = displayedItems.filter(item => {
    const type = (item.type || '').toLowerCase();
    return type.includes('jpg') || type.includes('jpeg') || type.includes('png') || 
           type.includes('gif') || type.includes('bmp') || type.includes('svg') ||
           (item.name && item.name.toLowerCase().includes('.jpg')) ||
           (item.name && item.name.toLowerCase().includes('.jpeg')) ||
           (item.name && item.name.toLowerCase().includes('.png'));
  }).length;
  
  const audioCount = displayedItems.filter(item => {
    const type = (item.type || '').toLowerCase();
    return type.includes('mp3') || type.includes('wav') || type.includes('aac') || 
           type.includes('ogg') || type.includes('flac') || type.includes('wma') ||
           (item.name && item.name.toLowerCase().includes('.mp3')) ||
           (item.name && item.name.toLowerCase().includes('.wav')) ||
           (item.name && item.name.toLowerCase().includes('.aac'));
  }).length;
  
  const presentationCount = displayedItems.filter(item => {
    const type = (item.type || '').toLowerCase();
    return type.includes('ppt') || type.includes('key') || type.includes('odp') ||
           (item.name && item.name.toLowerCase().includes('.ppt')) ||
           (item.name && item.name.toLowerCase().includes('.pptx'));
  }).length;
  
  const stats = [
    { label: 'Documents', value: documentCount, icon: <FileText size={24} />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Videos', value: videoCount, icon: <Video size={24} />, color: 'bg-purple-100 text-purple-600' },
    { label: 'Images', value: imageCount, icon: <ImageIcon size={24} />, color: 'bg-green-100 text-green-600' },
    { label: 'Audio', value: audioCount, icon: <Music size={24} />, color: 'bg-orange-100 text-orange-600' },
    { label: 'Presentations', value: presentationCount, icon: <Presentation size={24} />, color: 'bg-red-100 text-red-600' },
    { label: 'Total Items', value: displayedItems.length, icon: <TrendingUp size={24} />, color: 'bg-gray-100 text-gray-600' },
  ];

  const getCategoryIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={18} className="text-gray-400" />;
      case 'image': return <ImageIcon size={18} className="text-gray-400" />;
      default: return <FileText size={18} className="text-gray-400" />;
    }
  };

  const getDisplayCategory = (item) => {
    return item.category || item.tag || item.category_name || item.categoryName || 'Unknown';
  };

  const getDisplayUser = (item) => {
    return item.userName || item.user_name || item.uploadedBy || item.uploader || item.userId || 'Unknown';
  };

  const handleDelete = (docId) => {
    setConfirmDocId(docId);
    setConfirmAction('delete');
    setConfirmType('confirm');
    setConfirmTitle('Move to archive');
    setConfirmMessage('This document will be moved to archive. After 30 days it will be deleted permanently.');
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
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
      setConfirmType('info');
      setConfirmTitle('Error');
      setConfirmMessage('Failed to move document to archive.');
      setConfirmOpen(true);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <PageHeader 
        title="Knowledge Library"
        actions={
          <>
            <Button 
              variant="outline" 
              icon={<Download size={18} />}
              className="bg-white"
            >
              Export
            </Button>
            <Button 
              variant="primary" 
              icon={<FileText size={18} />}
              onClick={() => onNavigate && onNavigate('onboarding')}
            >
              Add Content
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} padding="p-4" className="bg-white">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        type={confirmType}
        confirmText={
          confirmType === 'confirm'
            ? (confirmAction === 'delete' ? 'Delete' : (confirmAction === 'approve' ? 'Approve' : 'OK'))
            : 'Close'
        }
        cancelText="Cancel"
        onConfirm={confirmType === 'confirm' ? onConfirmDelete : () => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-amber-800 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowSortDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-0 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Filter size={18} />
                Category
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {['All', 'Document', 'Spreadsheet', 'Video', 'Image', 'Audio'].map((cat) => (
                      <button
                        key={cat}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setFilterCategory(cat.toLowerCase());
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowCategoryDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-0 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Sort by Date
                <ChevronDown size={16} />
              </button>
              
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {['Date', 'Name', 'Size', 'Views'].map((sort) => (
                      <button
                        key={sort}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setSortBy(sort.toLowerCase());
                          setShowSortDropdown(false);
                        }}
                      >
                        Sort by {sort}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggles */}
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-amber-800 text-white' : 'bg-white hover:bg-gray-50 text-gray-600'
              }`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-amber-800 text-white' : 'bg-white hover:bg-gray-50 text-gray-600'
              }`}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Display */}
      {isLoading ? (
        <Card>
          <div className="text-center py-12 text-gray-600">Loading library items...</div>
        </Card>
      ) : hasApiError ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-yellow-800 mb-4">Unable to load library items</div>
            <Button variant="primary" onClick={onRetry}>Retry</Button>
          </div>
        </Card>
      ) : (
        <>
          {displayedItems && displayedItems.length > 0 ? (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayedItems.map((item) => (
                    <LibraryCardItem key={item.id} item={item} />
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'list' && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          {/* <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th> */}
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          {/* <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th> */}
                          {/* <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th> */}
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {displayedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-start gap-2">
                                {getCategoryIcon(item.type)}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  <div className="text-xs text-gray-500">by {getDisplayUser(item)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-block px-2 py-0.5 bg-white border-2 border-gray-200 text-gray-900 rounded-lg text-xs font-medium">
                                {getDisplayCategory(item)}
                              </span>
                            </td>
                            {/* <td className="py-4 px-4">
                              <div className="flex gap-1.5 flex-wrap">
                                {item.tag ? (
                                  <span className="inline-block px-2.5 py-1 bg-gray-200 text-gray-900 rounded text-xs font-medium">
                                    {item.tag}
                                  </span>
                                ) : (
                                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-400 rounded text-xs italic">
                                    No tag
                                  </span>
                                )}
                              </div>
                            </td> */}
                            <td className="py-4 px-4 text-sm text-gray-600">{item.size}</td>
                            {/* <td className="py-4 px-4 text-sm text-gray-600">{item.duration || '—'}</td> */}
                            {/* <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Eye size={14} className="text-gray-400" />
                                {item.views}
                              </div>
                            </td>*/}
                            <td className="py-4 px-4 text-sm text-gray-600">{item.uploadedDate || item.uploaded || '—'}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {/* <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                                  <ExternalLink size={16} className="text-gray-600" />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                                  <Download size={16} className="text-gray-600" />
                                </button> */}

                                <button 
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} className="text-gray-400 hover:text-red-600" />
                                </button>
                              </div>
                            </td> 
                            
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="text-center py-8 text-gray-500">
                No documents available
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ContentLibraryScreen;