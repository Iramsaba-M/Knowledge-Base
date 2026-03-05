import React, { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/feature/StatCard';
import Card from '../components/atomic/Card';
import { FileText, CheckCircle, MessageSquare, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const DashboardScreen = ({ onNavigate, documents = [], activities = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Handle recent activities - accept as props or use empty array
  const allActivities = activities || [];

  const totalItems = allActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = allActivities.slice(startIndex, endIndex);

  const getActionBadge = (type) => {
    if (type === 'upload') {
      return <span className="inline-block px-3 py-1 bg-amber-800 text-white text-xs font-medium rounded-md">Document uploaded</span>;
    } else if (type === 'query') {
      return <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">Query processed</span>;
    } else {
      return <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">Document processed</span>;
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <PageHeader
        title="Dashboard"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Documents"
          value={documents ? documents.length : 0}
          icon={<FileText size={24} />}
          color="blue"
        />
        <StatCard
          title="Processed Files"
          value={documents ? documents.filter(doc => doc.status === 'Completed' || doc.processed).length : 0}
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Queries Made"
          value="0"
          icon={<MessageSquare size={24} />}
          color="purple"
        />
        <StatCard
          title="Pending Processing"
          value={documents ? documents.filter(doc => !doc.status || doc.status === 'Processing' || doc.status === 'Queued').length : 0}
          icon={<Clock size={24} />}
          color="orange"
        />
      </div>

      {/* Recent Activity Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>

        {currentActivities && currentActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      {getActionBadge(activity.type)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">{activity.item || 'N/A'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{activity.user || 'Unknown'}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{activity.time || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        )}

        {currentActivities && currentActivities.length > 0 && (
          /* Pagination */
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
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
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
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

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Show first page, last page, current page, and one page on each side
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
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
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="px-1">...</span>;
                }
                return null;
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
        )}
      </Card>
    </div>
  );
};

export default DashboardScreen;