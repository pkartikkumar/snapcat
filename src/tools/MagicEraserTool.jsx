import React, { useState, useRef, useEffect } from 'react';
import { runInpainting } from '../utils/inpaintEngine';

export default function MagicEraserTool() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fileName, setFileName] = useState('cleaned-image.png');
  const [brushSize, setBrushSize] = useState(28);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const imgCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(`erased-${file.name.replace(/\.[^/.]+$/, '')}.png`);
    setError('');

    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      requestAnimationFrame(() => {
        const imgCanvas = imgCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!imgCanvas || !maskCanvas) return;

        imgCanvas.width = maskCanvas.width = img.width;
        imgCanvas.height = maskCanvas.height = img.height;

        imgCanvas.getContext('2d').drawImage(img, 0, 0);
        maskCanvas.getContext('2d').clearRect(0, 0, img.width, img.height);
      });
    };
    img.src = URL.createObjectURL(file);
  };

  const getCoords = (e) => {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawStroke = (e) => {
    if (!isDrawing) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    const scaleFactor = canvas.width / canvas.getBoundingClientRect().width;

    ctx.fillStyle = 'rgba(249, 115, 22, 0.75)';
    ctx.beginPath();
    ctx.arc(x, y, (brushSize * scaleFactor) / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    maskCanvas.getContext('2d').clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  };

  const handleErase = async () => {
    if (!imgCanvasRef.current || !maskCanvasRef.current) return;
    setLoading(true);
    setError('');

    try {
      const cleanedCanvas = await runInpainting(imgCanvasRef.current, maskCanvasRef.current);
      const imgCtx = imgCanvasRef.current.getContext('2d');
      imgCtx.clearRect(0, 0, imgCanvasRef.current.width, imgCanvasRef.current.height);
      imgCtx.drawImage(cleanedCanvas, 0, 0);
      clearMask();
    } catch (err) {
      console.error(err);
      setError('Model error: Ensure /models/lama-inpaint.onnx exists in public/models/.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imgCanvasRef.current) return;
    imgCanvasRef.current.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    }, 'image/png');
  };

  useEffect(() => {
    const stop = () => setIsDrawing(false);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, []);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-body">
      {!imageLoaded ? (
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
          <i className="bi bi-magic fs-1 mb-2 d-block" style={{ color: 'var(--primary-orange)' }}></i>
          <h2 className="h5 fw-bold text-body mb-1">Select Photo to Erase Objects or Blemishes</h2>
          <p className="text-secondary small mb-0">
            Brush over unwanted objects, text, or people and erase them 100% locally in your browser.
          </p>
        </label>
      ) : (
        <div>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="brushRange" className="small fw-semibold text-body mb-0">
                Brush Size: {brushSize}px
              </label>
              <input
                id="brushRange"
                type="range"
                min="8"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ width: '120px' }}
              />
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={clearMask}
                disabled={loading}
              >
                Clear Brush
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => setImageLoaded(false)}
                disabled={loading}
              >
                New Photo
              </button>
              <button
                type="button"
                className="btn btn-sm btn-snapcat rounded-pill px-4 fw-semibold"
                onClick={handleErase}
                disabled={loading}
              >
                {loading ? 'Erasing with AI...' : 'Erase Selected Area'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-success rounded-pill px-3 fw-semibold"
                onClick={handleDownload}
                disabled={loading}
              >
                <i className="bi bi-download me-1"></i>Save PNG
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger small">{error}</div>}

          <div className="text-center bg-body-tertiary p-3 rounded-4 border overflow-auto">
            <p className="small text-secondary mb-2">
              Paint over the object you want to remove, then click <strong>Erase Selected Area</strong>.
            </p>
            <div className="position-relative d-inline-block" style={{ maxWidth: '100%' }}>
              <canvas
                ref={imgCanvasRef}
                className="rounded-3 d-block"
                style={{ maxWidth: '100%', maxHeight: '480px', height: 'auto' }}
              />
              <canvas
                ref={maskCanvasRef}
                onMouseDown={(e) => {
                  setIsDrawing(true);
                  drawStroke(e);
                }}
                onMouseMove={drawStroke}
                onTouchStart={(e) => {
                  setIsDrawing(true);
                  drawStroke(e);
                }}
                onTouchMove={drawStroke}
                className="position-absolute top-0 start-0 rounded-3"
                style={{
                  width: '100%',
                  height: '100%',
                  cursor: 'crosshair',
                  touchAction: 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}