import React, { useState } from 'react';
import DropZone from '../components/DropZone';
import { convertImagesToPDF } from '../utils/pdfEngine';

export default function PdfTool() {
  const [files, setFiles] = useState([]);
  const [orientation, setOrientation] = useState('portrait');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleFiles = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setPdfUrl(null);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPdfUrl(null);
  };

  const handleGeneratePdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setPdfUrl(null);

    try {
      const blob = await convertImagesToPDF(files, orientation);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <DropZone onFilesSelected={handleFiles} multiple={true} />

      {files.length > 0 && (
        <div className="card border-0 bg-body shadow-sm rounded-4 mt-4 p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
            <span className="fw-semibold text-body">
              {files.length} page{files.length > 1 ? 's' : ''} in queue
            </span>

            <div className="d-flex align-items-center gap-3">
              {/* Orientation Selector */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`btn ${
                    orientation === 'portrait' ? 'btn-secondary' : 'btn-outline-secondary'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`btn ${
                    orientation === 'landscape' ? 'btn-secondary' : 'btn-outline-secondary'
                  }`}
                >
                  Landscape
                </button>
              </div>

              <button
                onClick={handleGeneratePdf}
                disabled={isProcessing}
                className="btn btn-snapcat px-4 rounded-pill d-flex align-items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf-fill"></i>
                    Compile PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Thumbnails Queue */}
          <div className="row g-2 mt-3">
            {files.map((file, idx) => (
              <div key={idx} className="col-4 col-sm-3 col-md-2 position-relative">
                <div
                  className="rounded border p-1 text-center bg-body-tertiary position-relative overflow-hidden"
                  style={{ height: '90px' }}
                >
                  <span className="badge bg-dark position-absolute top-0 start-0 m-1 opacity-75">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '20px', height: '20px' }}
                    title="Remove page"
                  >
                    &times;
                  </button>
                  <p
                    className="small text-truncate mt-4 mb-0 text-secondary"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Download Generated PDF Card */}
          {pdfUrl && (
            <div className="alert alert-success d-flex flex-wrap align-items-center justify-content-between mt-4 mb-0 rounded-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                <div>
                  <h6 className="mb-0 fw-bold">PDF Ready for Download</h6>
                  <small className="text-secondary">
                    {files.length} image{files.length > 1 ? 's' : ''} packed into standard A4 format
                  </small>
                </div>
              </div>

              <a
                href={pdfUrl}
                download="snapcat_document.pdf"
                className="btn btn-success px-4 rounded-pill d-flex align-items-center gap-2 mt-2 mt-sm-0"
              >
                <i className="bi bi-download"></i> Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}