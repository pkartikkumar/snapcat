import React from 'react';

export default function ResultCard({ item, isTransparent = false }) {
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const savedPercent = Math.round(
    ((item.originalSize - item.newSize) / item.originalSize) * 100
  );

  return (
    <div className="card border-0 bg-body shadow-sm rounded-3 mb-2">
      <div className="card-body p-3 d-flex align-items-center justify-content-between">
        {/* Thumbnail & File Details */}
        <div className="d-flex align-items-center gap-3 text-truncate">
          <div
            className={`rounded border overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center ${
              isTransparent ? 'bg-transparency-grid' : 'bg-body-secondary'
            }`}
            style={{ width: '48px', height: '48px' }}
          >
            <img
              src={item.previewUrl}
              alt={item.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>

          <div className="text-truncate">
            <h6 className="mb-0 fw-semibold text-body small text-truncate" title={item.name}>
              {item.name}
            </h6>
            <div className="d-flex align-items-center gap-2 small mt-1">
              <span className="text-secondary">{formatSize(item.originalSize)}</span>
              <i className="bi bi-arrow-right text-secondary small"></i>
              <span className="text-success fw-medium">{formatSize(item.newSize)}</span>
              {savedPercent > 0 && (
                <span className="badge bg-success-subtle text-success py-0 px-1">
                  -{savedPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Download Action Button */}
        <div className="ms-3 flex-shrink-0">
          <a
            href={item.previewUrl}
            download={item.name}
            className="btn btn-sm btn-outline-secondary border d-flex align-items-center gap-1 px-3 py-1.5 rounded-pill"
            title="Download file"
          >
            <i className="bi bi-download"></i>
            <span className="d-none d-md-inline">Download</span>
          </a>
        </div>
      </div>
    </div>
  );
}