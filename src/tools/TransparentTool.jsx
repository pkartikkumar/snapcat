import React, { useState, useRef } from 'react';
import DropZone from '../components/DropZone';
import { autoRemoveBackground, trimTransparentPadding, compositeWithBackground } from '../utils/aiPngEngine';
import { makeTransparentPNG } from '../utils/imageEngine';

const PRESET_COLORS = [
  { name: 'White', hex: '#FFFFFF', border: true },
  { name: 'Studio Black', hex: '#0F172A', border: false },
  { name: 'Neutral Grey', hex: '#E2E8F0', border: true },
  { name: 'Cat Orange', hex: '#F97316', border: false },
  { name: 'Pastel Mint', hex: '#A7F3D0', border: false },
  { name: 'Sky Blue', hex: '#BAE6FD', border: false },
  { name: 'Warm Cream', hex: '#FEF3C7', border: false },
];

export default function TransparentTool() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [rawCutoutBlob, setRawCutoutBlob] = useState(null);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState(null);

  // Cutout Settings
  const [engineMode, setEngineMode] = useState('ai'); // 'ai' | 'color'
  const [colorKeyHex, setColorKeyHex] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(25);
  const [autoTrim, setAutoTrim] = useState(true);

  // Background Options (Picsart Style)
  const [bgType, setBgType] = useState('transparent'); // 'transparent' | 'color' | 'image'
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [bgImageFile, setBgImageFile] = useState(null);
  const [bgImagePreview, setBgImagePreview] = useState(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const bgInputRef = useRef(null);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setPreviewSrc(URL.createObjectURL(file));
    setRawCutoutBlob(null);
    setRenderedBlobUrl(null);
    setProgress(0);
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const handleCutout = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgress(15);

    try {
      let finalBlob = null;

      if (engineMode === 'ai') {
        finalBlob = await autoRemoveBackground(selectedFile, (p) => setProgress(p));
      } else {
        const item = await makeTransparentPNG(selectedFile, hexToRgb(colorKeyHex), tolerance);
        finalBlob = item.blob;
      }

      if (autoTrim && finalBlob) {
        finalBlob = await trimTransparentPadding(finalBlob);
      }

      setRawCutoutBlob(finalBlob);
      // Immediately render with current background
      await updateRenderedOutput(finalBlob, { type: bgType, value: bgColor, imageFile: bgImageFile });
    } catch (err) {
      alert('PNG Extraction failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateRenderedOutput = async (cutout, bgConfig) => {
    if (!cutout) return;
    const composited = await compositeWithBackground(cutout, bgConfig);
    setRenderedBlobUrl(URL.createObjectURL(composited));
  };

  const applyColorBg = (hex) => {
    setBgType('color');
    setBgColor(hex);
    if (rawCutoutBlob) {
      updateRenderedOutput(rawCutoutBlob, { type: 'color', value: hex });
    }
  };

  const applyTransparentBg = () => {
    setBgType('transparent');
    if (rawCutoutBlob) {
      updateRenderedOutput(rawCutoutBlob, { type: 'transparent' });
    }
  };

  const handleCustomBgImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBgImageFile(file);
      setBgImagePreview(URL.createObjectURL(file));
      setBgType('image');
      if (rawCutoutBlob) {
        updateRenderedOutput(rawCutoutBlob, { type: 'image', imageFile: file });
      }
    }
  };

  return (
    <div>
      {!selectedFile ? (
        <DropZone onFilesSelected={handleFiles} multiple={false} />
      ) : (
        <div className="card border-0 bg-body shadow-sm rounded-4 p-4">
          {/* Header Controls Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
            {/* Mode Switcher */}
            <div className="btn-group btn-group-sm p-1 bg-body-tertiary rounded-pill border" role="group">
              <button
                type="button"
                onClick={() => setEngineMode('ai')}
                className={`btn rounded-pill px-3 ${
                  engineMode === 'ai' ? 'btn-snapcat' : 'text-body'
                }`}
              >
                <i className="bi bi-stars me-1 text-warning"></i> AI Auto-Cutout
              </button>
              <button
                type="button"
                onClick={() => setEngineMode('color')}
                className={`btn rounded-pill px-3 ${
                  engineMode === 'color' ? 'btn-snapcat' : 'text-body'
                }`}
              >
                <i className="bi bi-eyedropper me-1"></i> Solid Color Keyer
              </button>
            </div>

            {/* Mode-Specific Settings */}
            <div className="d-flex flex-wrap align-items-center gap-3">
              {engineMode === 'color' && (
                <>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-secondary">Target:</span>
                    <input
                      type="color"
                      value={colorKeyHex}
                      onChange={(e) => setColorKeyHex(e.target.value)}
                      className="form-control form-control-color border-0 p-0 rounded-circle"
                      style={{ width: '28px', height: '28px', cursor: 'pointer' }}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-secondary">Sensitivity</span>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={tolerance}
                      onChange={(e) => setTolerance(parseInt(e.target.value))}
                      className="form-range"
                      style={{ width: '90px' }}
                    />
                  </div>
                </>
              )}

              {/* Auto-Trim Margin Toggle */}
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoTrimSwitch"
                  checked={autoTrim}
                  onChange={(e) => setAutoTrim(e.target.checked)}
                />
                <label className="form-check-label small text-body" htmlFor="autoTrimSwitch">
                  Auto-Trim
                </label>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCutout}
                disabled={isProcessing}
                className="btn btn-snapcat px-4 rounded-pill d-flex align-items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Extracting... {progress > 0 && `${progress}%`}
                  </>
                ) : (
                  <>
                    <i className="bi bi-magic"></i> Generate PNG
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Canvas Comparison / Viewport */}
          <div className="row g-3 my-3">
            {/* Original Preview */}
            <div className="col-12 col-md-6">
              <span className="small fw-semibold text-secondary mb-2 d-block">Original Image</span>
              <div
                className="rounded border p-2 bg-body-tertiary d-flex align-items-center justify-content-center overflow-hidden"
                style={{ height: '360px' }}
              >
                <img
                  src={previewSrc}
                  alt="Original"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Cutout Preview */}
            <div className="col-12 col-md-6">
              <span className="small fw-semibold text-secondary mb-2 d-block">Preview & Background</span>
              <div
                className={`rounded border p-2 d-flex align-items-center justify-content-center overflow-hidden ${
                  bgType === 'transparent' ? 'bg-transparency-grid' : ''
                }`}
                style={{
                  height: '360px',
                  backgroundColor: bgType === 'color' ? bgColor : undefined,
                  backgroundImage: bgType === 'image' && bgImagePreview ? `url(${bgImagePreview})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {renderedBlobUrl ? (
                  <img
                    src={renderedBlobUrl}
                    alt="Result"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="text-center text-secondary small">
                    <i className="bi bi-arrow-left-circle fs-3 d-block mb-1"></i>
                    Click &ldquo;Generate PNG&rdquo; to extract subject
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Background Palette Bar */}
          <div className="bg-body-tertiary border rounded-3 p-3 mb-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="small fw-semibold text-body">Background:</span>

                {/* 1. Transparent Grid */}
                <button
                  onClick={applyTransparentBg}
                  className={`btn btn-sm d-flex align-items-center gap-1 rounded-pill ${
                    bgType === 'transparent' ? 'btn-secondary fw-bold' : 'btn-outline-secondary'
                  }`}
                  title="Transparent PNG"
                >
                  <i className="bi bi-grid-3x3"></i> Transparent
                </button>

                {/* 2. Preset Swatches */}
                <div className="d-flex align-items-center gap-1.5 ms-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyColorBg(preset.hex)}
                      className={`rounded-circle border-0 p-0 shadow-sm ${
                        bgType === 'color' && bgColor === preset.hex ? 'ring-2 ring-orange-500' : ''
                      }`}
                      style={{
                        width: '26px',
                        height: '26px',
                        backgroundColor: preset.hex,
                        border: preset.border ? '1px solid #cbd5e1' : 'none',
                        outline: bgType === 'color' && bgColor === preset.hex ? '2px solid var(--primary-orange)' : 'none',
                        cursor: 'pointer',
                      }}
                      title={preset.name}
                    />
                  ))}

                  {/* 3. Custom Color Picker */}
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => applyColorBg(e.target.value)}
                    className="form-control form-control-color border-0 p-0 rounded-circle ms-1"
                    style={{ width: '26px', height: '26px', cursor: 'pointer' }}
                    title="Choose custom background color"
                  />
                </div>
              </div>

              {/* 4. Custom Background Image Upload */}
              <div className="d-flex align-items-center gap-2">
                <input
                  type="file"
                  ref={bgInputRef}
                  onChange={handleCustomBgImage}
                  accept="image/*"
                  className="d-none"
                />
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 ${
                    bgType === 'image' ? 'btn-dark' : 'btn-outline-secondary'
                  }`}
                >
                  <i className="bi bi-image"></i>
                  <span>{bgImageFile ? 'Change Backdrop' : 'Add Image Backdrop'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Download Bar & Reset */}
          {renderedBlobUrl && (
            <div className="alert alert-success d-flex flex-wrap align-items-center justify-content-between mb-0 rounded-3">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-check-circle-fill fs-3 text-success"></i>
                <div>
                  <h6 className="mb-0 fw-bold">Image Ready for Export</h6>
                  <small className="text-secondary">
                    {bgType === 'transparent'
                      ? 'Lossless transparent PNG'
                      : `Composited with ${bgType === 'image' ? 'custom backdrop' : 'solid background'}`}
                  </small>
                </div>
              </div>

              <div className="d-flex gap-2 mt-2 mt-sm-0">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setRenderedBlobUrl(null);
                    setRawCutoutBlob(null);
                    setBgImageFile(null);
                    setBgImagePreview(null);
                  }}
                  className="btn btn-outline-secondary rounded-pill px-3"
                >
                  New Image
                </button>
                <a
                  href={renderedBlobUrl}
                  download={`${selectedFile.name.split('.')[0]}_snapcat_${bgType}.png`}
                  className="btn btn-success px-4 rounded-pill d-flex align-items-center gap-2"
                >
                  <i className="bi bi-download"></i> Download Export
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}