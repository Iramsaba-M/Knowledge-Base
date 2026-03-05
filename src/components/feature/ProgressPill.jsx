import React from 'react';

// Upload states: upload_started → uploading → uploaded
// Processing states (post-approve): extracting → chunking → storing → completed
const STATUS_CONFIG = {
  // Upload phase
  upload_started: { label: 'Upload Started', color: 'bg-amber-800' },
  uploading: { label: 'Uploading', color: 'bg-amber-800' },
  uploaded: { label: 'Uploaded', color: 'bg-green-800' },
  // Processing phase (post-approve)
  extracting: { label: 'Extracting', color: 'bg-amber-800' },
  chunking: { label: 'Chunking', color: 'bg-amber-800' },
  storing: { label: 'Storing', color: 'bg-amber-800' },
  processing: { label: 'Processing', color: 'bg-amber-800' },
  completed: { label: 'Completed', color: 'bg-green-800' },
  failed: { label: 'Failed', color: 'bg-red-800' },
  error: { label: 'Error', color: 'bg-red-800' },
};

const ProgressPill = ({ status, progress_percentage, message }) => {
  if (!status) return null;

  // Final/Inactive states show a dash
  const isFinished = status === 'completed' || status === 'failed' || status === 'error' || status === 'uploaded';

  const config = STATUS_CONFIG[status];

  if (isFinished || !config) {
    return <span className="text-gray-400">—</span>;
  }

  // progress_percentage can be null (upload API response) — treat as 0
  const pct = progress_percentage ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        {/* <span className="text-xs font-medium text-gray-500">{config.label}</span> */}
        {/* {pct > 0 && <span className="text-xs text-gray-400">{pct}%</span>} */}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${config.color}`}
          style={{
            width: `${pct}%`,
          }}
        />
      </div>
      {message && <p className="text-xs mt-1 text-gray-500">{message}</p>}
    </div>
  );
};

export default ProgressPill;