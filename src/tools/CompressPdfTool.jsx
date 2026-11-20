import React, { useState } from 'react';
import { compressPdfFile, PDF_PRESETS } from '../utils/pdfCompressEngine';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPdfTool() {
  const [file, setFile] = useState(null);
  const [presetKey, setPresetKey] = useState('recommended');
  const [quality, setQuality] = useState(PDF_PRESETS.recommended.quality);
  const [scale, setScale] = useState(PDF_PRESETS.recommended.scale);
  const [grayscale, setGrayscale] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSelectPreset = (key) => {
    setPresetKey(key);
    setQuality(PDF_PRESETS[key].quality);
    setScale(PDF_PRESETS[key].scale);
    setResult(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document.');
      return;
    }
    setFile(selected);
    setResult(null);
    setError('');
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setError('');

    try {
      const compressed = await compressPdfFile(
        file,
        { scale, quality, grayscale },
        (pct) => setProgress(pct)
      );
      setResult(compressed);
    } catch (err) {
      console.error(err);
      setError(`Compression error: ${err?.message || 'Unable to process this PDF file.'}`);
    } finally {
      setLoading(false);
    }
  };

  const savedPercent = result
    ? Math.max(0, Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100))
    : 0;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-body">
      {!file ? (
        <label
          className="border border-2 border-dashed rounded-4 p-5 text-center d-block"
          style={{ cursor: 'pointer', borderColor: 'var(--primary-orange)' }}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="d-none"
            onChange={handleFileChange}
          />
          <i className="bi bi-file-earmark-pdf-fill fs-1 mb-2 d-block" style={{ color: 'var(--primary-orange)' }}></i>
          <h2 className="h5 fw-bold text-body mb-1">Select PDF Document to Compress</h2>
          <p className="text-secondary small mb-0">
            Shrink multi-page PDFs to 100 KB – 500 KB locally in your browser. Zero file uploads.
          </p>
        </label>
      ) : (
        <div>
          {/* Top File Header */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 pb-3 border-bottom">
            <div className="small text-secondary">
              <i className="bi bi-file-earmark-pdf text-danger me-1"></i>
              <strong className="text-body">{file.name}</strong> ({formatBytes(file.size)})
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError('');
              }}
              disabled={loading}
            >
              Choose Another PDF
            </button>
          </div>

          {/* Preset Selector */}
          <div className="row g-3 mb-4">
            {Object.entries(PDF_PRESETS).map(([key, item]) => (
              <div key={key} className="col-12 col-md-4">
                <button
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  disabled={loading}
                  className={`w-100 h-100 text-start p-3 rounded-4 border transition-all ${
                    presetKey === key
                      ? 'border-2 bg-body-tertiary shadow-sm'
                      : 'bg-body border-secondary-subtle'
                  }`}
                  style={{
                    borderColor: presetKey === key ? 'var(--primary-orange)' : undefined,
                  }}
                >
                  <div className="fw-bold small text-body mb-1">{item.label}</div>
                  <div className="text-secondary" style={{ fontSize: '0.78rem' }}>
                    {item.desc}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Fine-Tune Controls */}
          <div className="row g-3 align-items-center p-3 rounded-4 bg-body-tertiary border mb-4">
            <div className="col-12 col-md-5">
              <label htmlFor="pdfQualityRange" className="form-label small fw-semibold mb-1">
                Image Quality: {Math.round(quality * 100)}%
              </label>
              <input
                id="pdfQualityRange"
                type="range"
                className="form-range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={quality}
                disabled={loading}
                onChange={(e) => {
                  setPresetKey('custom');
                  setQuality(Number(e.target.value));
                  setResult(null);
                }}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="pdfScaleRange" className="form-label small fw-semibold mb-1">
                Resolution Scale: {Math.round(scale * 72)} DPI
              </label>
              <input
                id="pdfScaleRange"
                type="range"
                className="form-range"
                min="0.8"
                max="2.2"
                step="0.2"
                value={scale}
                disabled={loading}
                onChange={(e) => {
                  setPresetKey('custom');
                  setScale(Number(e.target.value));
                  setResult(null);
                }}
              />
            </div>

            <div className="col-12 col-md-3">
              <div className="form-check form-switch mt-md-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="pdfGrayscaleSwitch"
                  checked={grayscale}
                  disabled={loading}
                  onChange={(e) => {
                    setGrayscale(e.target.checked);
                    setResult(null);
                  }}
                />
                <label className="form-check-label small fw-semibold" htmlFor="pdfGrayscaleSwitch">
                  Grayscale Scan Mode
                </label>
              </div>
            </div>
          </div>

          {/* Compress Action Button */}
          <div className="text-center mb-3">
            <button
              type="button"
              className="btn btn-snapcat rounded-pill px-5 py-2 fw-semibold"
              onClick={handleCompress}
              disabled={loading}
            >
              {loading ? `Compressing Pages... ${progress}%` : 'Compress PDF Now'}
            </button>
          </div>

          {loading && (
            <div className="progress mb-4" style={{ height: '10px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                style={{ width: `${progress || 10}%` }}
              ></div>
            </div>
          )}

          {error && <div className="alert alert-danger small">{error}</div>}

          {/* Result Card */}
          {result && (
            <div className="p-4 rounded-4 bg-body-tertiary border text-center mt-4">
              <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3">
                <div>
                  <span className="text-secondary small d-block">Original Size</span>
                  <strong className="text-body">{formatBytes(result.originalSize)}</strong>
                </div>
                <i className="bi bi-arrow-right text-secondary fs-5"></i>
                <div>
                  <span className="text-secondary small d-block">Compressed Size</span>
                  <strong className="text-success fs-5">{formatBytes(result.compressedSize)}</strong>
                </div>
                <span className="badge bg-success rounded-pill px-3 py-2">
                  Saved {savedPercent}% ({result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'})
                </span>
              </div>

              {result.compressedSize >= result.originalSize && (
                <p className="text-warning small mb-3">
                  This PDF is already tightly optimized. Try lowering Image Quality or Resolution Scale for a smaller file.
                </p>
              )}

              <a
                href={result.url}
                download={`compressed-${file.name}`}
                className="btn btn-success rounded-pill px-4 py-2 fw-semibold"
              >
                <i className="bi bi-download me-2"></i>Download Compressed PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}