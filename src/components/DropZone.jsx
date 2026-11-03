import React, { useState, useRef } from 'react';
import { ACCEPTED_IMAGE_TYPES } from '../constants/toolConfig';

export default function DropZone({ onFilesSelected, multiple = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`dropzone-container p-5 text-center rounded-4 ${
        isDragging ? 'drag-active' : ''
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple={multiple}
        accept={ACCEPTED_IMAGE_TYPES}
        className="d-none"
      />

      <div className="mb-3">
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 shadow-sm"
          style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}
        >
          <i
            className="bi bi-cloud-arrow-up display-5"
            style={{ color: 'var(--primary-orange)' }}
          ></i>
        </div>
      </div>

      <h5 className="fw-bold mb-1 text-body">
        Drop your images here, or <span style={{ color: 'var(--primary-orange)' }}>browse</span>
      </h5>
      <p className="text-secondary small mb-0">
        Supports PNG, JPEG, WebP, AVIF, and Apple HEIC/HEIF photos
      </p>
    </div>
  );
}