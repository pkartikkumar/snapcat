import React, { useState } from 'react';
import { upscaleImageFile } from '../utils/upscaleEngine';

export default function UpscaleTool() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError('');
  };

  const handleUpscale = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setError('');

    try {
      const upscaled = await upscaleImageFile(file, (pct) => setProgress(pct));
      setResult(upscaled);
    } catch (err) {
      console.error(err);
      setError(`Upscale error: ${err?.message || 'Unable to run AI model in browser.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-body">
      {!file ? (
        <label
          className="border border-2 border-dashed rounded-4 p-5 text-center d-block"
          style={{ cursor: 'pointer', borderColor: 'var(--primary-orange)' }}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="d-none"
            onChange={handleFileChange}
          />
          <i className="bi bi-stars fs-1 mb-2 d-block" style={{ color: 'var(--primary-orange)' }}></i>
          <h2 className="h5 fw-bold text-body mb-1">Select Image to Upscale 4×</h2>
          <p className="text-secondary small mb-0">
            100% in-browser AI enhancement (JPG, PNG, WebP). Zero server uploads.
          </p>
        </label>
      ) : (
        <div>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 pb-3 border-bottom">
            <div className="small text-secondary">
              <strong className="text-body">{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                disabled={loading}
              >
                Change Image
              </button>
              <button
                type="button"
                className="btn btn-sm btn-snapcat rounded-pill px-4 fw-semibold"
                onClick={handleUpscale}
                disabled={loading}
              >
                {loading
                  ? progress === 0
                    ? 'Loading AI Model...'
                    : `Upscaling... ${progress}%`
                  : 'Upscale 4× Now'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="progress mb-4" style={{ height: '10px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                style={{ width: `${progress || 15}%` }}
              ></div>
            </div>
          )}

          {error && <div className="alert alert-danger small">{error}</div>}

          <div className="row g-4 text-center">
            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-4 bg-body-tertiary">
                <div className="badge bg-secondary mb-2">Original</div>
                <img
                  src={previewUrl}
                  alt="Original upload"
                  className="img-fluid rounded-3 d-block mx-auto"
                  style={{ maxHeight: '320px', objectFit: 'contain' }}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-4 bg-body-tertiary h-100 d-flex flex-column justify-content-center align-items-center">
                {result ? (
                  <>
                    <div className="badge bg-success mb-2">
                      4× Enhanced ({result.width} × {result.height} px)
                    </div>
                    <img
                      src={result.url}
                      alt="Upscaled output"
                      className="img-fluid rounded-3 mb-3 d-block mx-auto"
                      style={{ maxHeight: '320px', objectFit: 'contain' }}
                    />
                    <a
                      href={result.url}
                      download={`upscaled-4x-${file.name.replace(/\.[^/.]+$/, '')}.png`}
                      className="btn btn-success rounded-pill px-4 fw-semibold"
                    >
                      <i className="bi bi-download me-2"></i>Download HD PNG
                    </a>
                  </>
                ) : (
                  <p className="text-secondary small mb-0">
                    Click <strong>Upscale 4× Now</strong> to enhance clarity locally in your browser.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}