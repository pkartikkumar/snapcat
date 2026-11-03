import React, { useState } from 'react';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { convertSingleImage, bundleIntoZip } from '../utils/imageEngine';

export default function ConvertTool() {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [quality, setQuality] = useState(0.85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const handleFiles = (newFiles) => {
    setFiles(newFiles);
    setResults([]);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setResults([]);

    try {
      const output = [];
      for (const file of files) {
        const item = await convertSingleImage(file, targetFormat, quality);
        output.push(item);
      }
      setResults(output);
    } catch (err) {
      alert('Conversion failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const zipBlob = await bundleIntoZip(results);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapcat_converted_images.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <DropZone onFilesSelected={handleFiles} multiple={true} />

      {files.length > 0 && (
        <div className="card border-0 bg-body shadow-sm rounded-4 mt-4 p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
            <span className="fw-semibold text-body">
              {files.length} image{files.length > 1 ? 's' : ''} selected
            </span>

            <div className="d-flex flex-wrap align-items-center gap-3">
              {/* Target Format */}
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="form-select form-select-sm bg-body text-body border-secondary-subtle"
                style={{ width: '150px' }}
              >
                <option value="image/webp">Format: WebP</option>
                <option value="image/png">Format: PNG</option>
                <option value="image/jpeg">Format: JPEG</option>
              </select>

              {/* Quality Slider (for WebP and JPEG) */}
              {targetFormat !== 'image/png' && (
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-secondary">Quality</span>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
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

              {/* Action Button */}
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="btn btn-snapcat px-4 rounded-pill d-flex align-items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Converting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat"></i>
                    Convert Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-body">Converted Files</h6>
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