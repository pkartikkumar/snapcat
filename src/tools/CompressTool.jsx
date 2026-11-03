import React, { useState } from 'react';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { compressSingleImage, bundleCompressedZip } from '../utils/compressEngine';

const QUICK_PRESETS = [
  { label: '5 KB (Signatures)', value: 5 },
  { label: '10 KB (Thumbprint)', value: 10 },
  { label: '20 KB (Govt ID)', value: 20 },
  { label: '50 KB (Passport Pic)', value: 50 },
  { label: '100 KB', value: 100 },
  { label: '200 KB', value: 200 },
];

export default function CompressTool() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(0.7);
  const [useTargetKb, setUseTargetKb] = useState(true); // Default to strict limit
  const [targetKb, setTargetKb] = useState(5); // Default to 5 KB
  const [maxDimension, setMaxDimension] = useState(1920);
  const [outputFormat, setOutputFormat] = useState('image/jpeg');

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const handleFiles = (newFiles) => {
    setFiles(newFiles);
    setResults([]);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setResults([]);

    try {
      const output = [];
      for (const file of files) {
        const item = await compressSingleImage(file, {
          quality,
          maxWidth: maxDimension,
          maxHeight: maxDimension,
          targetMaxKb: useTargetKb ? targetKb : null,
          outputFormat,
        });
        output.push(item);
      }
      setResults(output);
    } catch (err) {
      alert('Compression failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const zipBlob = await bundleCompressedZip(results);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapcat_compressed_images.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalOriginalBytes = results.reduce((acc, r) => acc + r.originalSize, 0);
  const totalNewBytes = results.reduce((acc, r) => acc + r.newSize, 0);
  const totalSavedPercent = totalOriginalBytes
    ? Math.round(((totalOriginalBytes - totalNewBytes) / totalOriginalBytes) * 100)
    : 0;

  return (
    <div>
      <DropZone onFilesSelected={handleFiles} multiple={true} />

      {files.length > 0 && (
        <div className="card border-0 bg-body shadow-sm rounded-4 mt-4 p-4">
          {/* Controls Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
            <span className="fw-semibold text-body">
              {files.length} image{files.length > 1 ? 's' : ''} to compress
            </span>

            <div className="d-flex flex-wrap align-items-center gap-3">
              {/* Output Format */}
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="form-select form-select-sm bg-body text-body border-secondary-subtle"
                style={{ width: '130px' }}
              >
                <option value="image/jpeg">Output: JPEG</option>
                <option value="image/webp">Output: WebP</option>
              </select>

              {/* Strict Max Size (KB) Toggle */}
              <div className="d-flex align-items-center gap-2">
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="targetKbSwitch"
                    checked={useTargetKb}
                    onChange={(e) => setUseTargetKb(e.target.checked)}
                  />
                  <label className="form-check-label small text-body" htmlFor="targetKbSwitch">
                    Strict KB Limit
                  </label>
                </div>

                {useTargetKb ? (
                  <div className="input-group input-group-sm" style={{ width: '110px' }}>
                    <input
                      type="number"
                      min="2"
                      max="5000"
                      value={targetKb}
                      onChange={(e) => setTargetKb(Math.max(2, parseInt(e.target.value) || 5))}
                      className="form-control text-center"
                    />
                    <span className="input-group-text">KB</span>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-secondary">Quality</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="form-range"
                      style={{ width: '90px' }}
                    />
                    <span className="badge bg-secondary-subtle text-secondary border">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="btn btn-snapcat px-4 rounded-pill d-flex align-items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Compressing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-zip-fill"></i> Compress Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons for 5 KB, 10 KB, 20 KB, etc. */}
          {useTargetKb && (
            <div className="d-flex flex-wrap align-items-center gap-1.5 mt-3 pt-1">
              <span className="small text-secondary me-1">Quick Presets:</span>
              {QUICK_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setTargetKb(p.value)}
                  className={`btn btn-sm rounded-pill px-2.5 py-0.5 text-xs ${
                    targetKb === p.value
                      ? 'btn-secondary fw-bold'
                      : 'btn-outline-secondary'
                  }`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Results Summary & List */}
          {results.length > 0 && (
            <div className="mt-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 p-3 bg-body-tertiary rounded-3">
                <div>
                  <span className="fw-bold text-body">Total Space Saved: </span>
                  <span className="text-success fw-bold fs-6">
                    {totalSavedPercent > 0 ? `${totalSavedPercent}% Reduction` : 'Optimized'}
                  </span>
                </div>
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill mt-2 mt-sm-0"
                  >
                    <i className="bi bi-file-zip"></i> Download All as ZIP
                  </button>
                )}
              </div>

              <div className="d-flex flex-column gap-2">
                {results.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}