import React, { useState, useRef } from 'react';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { applyWatermark, bundleWatermarkedZip } from '../utils/watermarkEngine';

const POSITIONS = [
  { id: 'top-left', label: '↖' },
  { id: 'top', label: '↑' },
  { id: 'top-right', label: '↗' },
  { id: 'left', label: '←' },
  { id: 'center', label: '•' },
  { id: 'right', label: '→' },
  { id: 'bottom-left', label: '↙' },
  { id: 'bottom', label: '↓' },
  { id: 'bottom-right', label: '↘' },
];

export default function WatermarkTool() {
  const [files, setFiles] = useState([]);
  const [watermarkType, setWatermarkType] = useState('text'); // 'text' | 'image'
  
  // Text state
  const [text, setText] = useState('© SnapCat Private');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#ffffff');
  
  // Logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoScale, setLogoScale] = useState(20);
  const logoInputRef = useRef(null);

  // Common options
  const [opacity, setOpacity] = useState(0.7);
  const [position, setPosition] = useState('bottom-right');
  const [rotation, setRotation] = useState(0);
  const [tile, setTile] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const handleFiles = (newFiles) => {
    setFiles(newFiles);
    setResults([]);
  };

  const handleLogoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleApply = async () => {
    if (files.length === 0) return;
    if (watermarkType === 'image' && !logoFile) {
      alert('Please upload a logo/stamp image first.');
      return;
    }

    setIsProcessing(true);
    setResults([]);

    try {
      const output = [];
      for (const file of files) {
        const item = await applyWatermark(file, {
          type: watermarkType,
          text,
          fontSize,
          textColor,
          logoFile,
          logoScale,
          opacity,
          position,
          rotation,
          tile,
        });
        output.push(item);
      }
      setResults(output);
    } catch (err) {
      alert('Watermarking failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const zipBlob = await bundleWatermarkedZip(results);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapcat_watermarked_images.zip';
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
              {files.length} image{files.length > 1 ? 's' : ''} to stamp
            </span>

            {/* Type Switcher */}
            <div className="btn-group btn-group-sm p-1 bg-body-tertiary rounded-pill border" role="group">
              <button
                type="button"
                onClick={() => setWatermarkType('text')}
                className={`btn rounded-pill px-3 ${
                  watermarkType === 'text' ? 'btn-snapcat' : 'btn-light text-body'
                }`}
              >
                <i className="bi bi-fonts me-1"></i> Add Text
              </button>
              <button
                type="button"
                onClick={() => setWatermarkType('image')}
                className={`btn rounded-pill px-3 ${
                  watermarkType === 'image' ? 'btn-snapcat' : 'btn-light text-body'
                }`}
              >
                <i className="bi bi-image me-1"></i> Add Logo / Image
              </button>
            </div>
          </div>

          {/* Settings Section */}
          <div className="row g-3 mt-2 pb-3 border-bottom">
            {/* TYPE 1: TEXT SETTINGS */}
            {watermarkType === 'text' ? (
              <>
                <div className="col-12 col-md-5">
                  <label className="form-label text-secondary small mb-1">Watermark Text</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="form-control form-control-sm"
                    placeholder="e.g. Confidential or © Brand"
                  />
                </div>

                <div className="col-6 col-md-3">
                  <label className="form-label text-secondary small mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    min="12"
                    max="200"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 36)}
                    className="form-control form-control-sm text-center"
                  />
                </div>

                <div className="col-6 col-md-4 d-flex align-items-end gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-secondary">Color:</span>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="form-control form-control-color border-0 p-0 rounded-circle"
                      style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* TYPE 2: LOGO / STAMP SETTINGS */
              <>
                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small mb-1">Upload Stamp / Logo</label>
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="d-none"
                  />
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1.5"
                    >
                      <i className="bi bi-upload"></i>
                      <span>{logoFile ? logoFile.name : 'Select PNG / SVG'}</span>
                    </button>
                    {logoFile && (
                      <span className="badge bg-success-subtle text-success border">Loaded</span>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-secondary small mb-0">Logo Scale</label>
                    <span className="badge bg-secondary-subtle text-secondary border">{logoScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={logoScale}
                    onChange={(e) => setLogoScale(parseInt(e.target.value))}
                    className="form-range"
                  />
                </div>
              </>
            )}

            {/* COMMON CONTROLS: Opacity, Grid Position, Repeat Tile */}
            <div className="col-12 col-md-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-secondary small mb-0">Opacity</label>
                <span className="badge bg-secondary-subtle text-secondary border">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="form-range"
              />
            </div>

            <div className="col-6 col-md-4">
              <label className="form-label text-secondary small mb-1 d-block">Position Anchor</label>
              <div
                className="btn-group btn-group-sm d-grid"
                style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: '105px' }}
              >
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={tile}
                    onClick={() => setPosition(p.id)}
                    className={`btn p-1 ${
                      position === p.id && !tile ? 'btn-secondary fw-bold' : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: '0.75rem', height: '28px' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-6 col-md-4 d-flex flex-column justify-content-end gap-2">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="tilePatternSwitch"
                  checked={tile}
                  onChange={(e) => setTile(e.target.checked)}
                />
                <label className="form-check-label small text-body" htmlFor="tilePatternSwitch">
                  Repeat Diagonal Pattern
                </label>
              </div>

              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="btn btn-snapcat px-4 rounded-pill d-flex align-items-center justify-content-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Applying...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-shaded"></i> Apply Watermark
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-body">Watermarked Images</h6>
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