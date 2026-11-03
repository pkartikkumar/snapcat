import React, { useState } from 'react';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { resizeSingleImage, bundleResizedZip } from '../utils/resizeEngine';

export default function ResizeTool() {
  const [files, setFiles] = useState([]);
  const [resizeMode, setResizeMode] = useState('pixels'); // 'pixels' | 'percent'
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [scalePercent, setScalePercent] = useState(50);
  const [outputFormat, setOutputFormat] = useState('image/png');

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const handleFiles = (newFiles) => {
    setFiles(newFiles);
    setResults([]);
  };

  const handleResize = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setResults([]);

    try {
      const output = [];
      for (const file of files) {
        const item = await resizeSingleImage(file, {
          mode: resizeMode,
          targetWidth: parseInt(width) || null,
          targetHeight: parseInt(height) || null,
          scalePercent: parseInt(scalePercent) || 50,
          maintainAspectRatio: maintainRatio,
          outputFormat,
        });
        output.push(item);
      }
      setResults(output);
    } catch (err) {
      alert('Resize failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const zipBlob = await bundleResizedZip(results);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapcat_resized_images.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <DropZone onFilesSelected={handleFiles} multiple={true} />

      {files.length > 0 && (
        <div className="card border-0 bg-body shadow-sm rounded-4 mt-4 p-4">
          {/* Header Controls Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
            <span className="fw-semibold text-body">
              {files.length} image{files.length > 1 ? 's' : ''} to resize
            </span>

            {/* Mode Switcher */}
            <div className="btn-group btn-group-sm p-1 bg-body-tertiary rounded-pill border" role="group">
              <button
                type="button"
                onClick={() => setResizeMode('pixels')}
                className={`btn rounded-pill px-3 ${
                  resizeMode === 'pixels' ? 'btn-snapcat' : 'btn-light text-body'
                }`}
              >
                By Pixels
              </button>
              <button
                type="button"
                onClick={() => setResizeMode('percent')}
                className={`btn rounded-pill px-3 ${
                  resizeMode === 'percent' ? 'btn-snapcat' : 'btn-light text-body'
                }`}
              >
                By Percentage
              </button>
            </div>
          </div>

          {/* Settings Section */}
          <div className="row g-3 align-items-center mt-2 pb-3 border-bottom">
            {resizeMode === 'pixels' ? (
              <>
                <div className="col-6 col-sm-3">
                  <label className="form-label text-secondary small mb-1">Width (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="form-control form-control-sm text-center"
                    placeholder="Auto"
                  />
                </div>

                <div className="col-6 col-sm-3">
                  <label className="form-label text-secondary small mb-1">Height (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="form-control form-control-sm text-center"
                    placeholder="Auto"
                  />
                </div>

                <div className="col-12 col-sm-3 d-flex align-items-end">
                  <div className="form-check form-switch mb-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="ratioSwitch"
                      checked={maintainRatio}
                      onChange={(e) => setMaintainRatio(e.target.checked)}
                    />
                    <label className="form-check-label small text-body" htmlFor="ratioSwitch">
                      Lock Ratio
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-12 col-sm-6">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label text-secondary small mb-0">Scale Percentage</label>
                  <span className="badge bg-secondary-subtle text-secondary border">
                    {scalePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={scalePercent}
                  onChange={(e) => setScalePercent(parseInt(e.target.value))}
                  className="form-range"
                />
              </div>
            )}

            {/* Output Format Dropdown & Trigger Button */}
            <div className="col-12 col-sm-3 ms-auto d-flex align-items-end gap-2 justify-content-sm-end">
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="form-select form-select-sm"
                style={{ width: '120px' }}
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
              </select>

              <button
                onClick={handleResize}
                disabled={isProcessing}
                className="btn btn-snapcat btn-sm px-4 rounded-pill d-flex align-items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Resizing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrows-angle-expand"></i> Resize
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-body">Resized Images</h6>
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill"
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