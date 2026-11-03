import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'cropperjs';
import DropZone from '../components/DropZone';
import { decodeToBitmap } from '../utils/imageEngine';

export default function EditorTool() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [cropResultUrl, setCropResultUrl] = useState(null);
  const imageRef = useRef(null);
  const cropperInstanceRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setCropResultUrl(null);

    // Decode file safely (handling HEIC if dropped)
    const bitmap = await decodeToBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    setImageSrc(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    if (imageSrc && imageRef.current) {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
      }

      cropperInstanceRef.current = new Cropper(imageRef.current, {
        viewMode: 2,
        responsive: true,
        autoCropArea: 0.85,
      });
    }

    return () => {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
      }
    };
  }, [imageSrc]);

  const setAspectRatio = (ratio) => {
    if (cropperInstanceRef.current) {
      cropperInstanceRef.current.setAspectRatio(ratio);
    }
  };

  const rotate = (deg) => {
    if (cropperInstanceRef.current) {
      cropperInstanceRef.current.rotate(deg);
    }
  };

  const handleExport = () => {
    if (!cropperInstanceRef.current) return;
    const croppedCanvas = cropperInstanceRef.current.getCroppedCanvas();
    if (!croppedCanvas) return;

    croppedCanvas.toBlob((blob) => {
      if (blob) {
        setCropResultUrl(URL.createObjectURL(blob));
      }
    }, 'image/png');
  };

  return (
    <div>
      {!imageSrc ? (
        <DropZone onFilesSelected={handleFiles} multiple={false} />
      ) : (
        <div className="card border-0 bg-body shadow-sm rounded-4 p-4">
          {/* Controls Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
            {/* Aspect Ratio Presets */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                onClick={() => setAspectRatio(NaN)}
                className="btn btn-outline-secondary"
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio(1)}
                className="btn btn-outline-secondary"
              >
                1:1
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio(16 / 9)}
                className="btn btn-outline-secondary"
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio(4 / 3)}
                className="btn btn-outline-secondary"
              >
                4:3
              </button>
            </div>

            {/* Transform Controls */}
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => rotate(-90)}
                className="btn btn-sm btn-outline-secondary"
                title="Rotate Left"
              >
                <i className="bi bi-arrow-counterclockwise"></i> -90°
              </button>
              <button
                onClick={() => rotate(90)}
                className="btn btn-sm btn-outline-secondary"
                title="Rotate Right"
              >
                <i className="bi bi-arrow-clockwise"></i> +90°
              </button>

              <button
                onClick={handleExport}
                className="btn btn-snapcat px-4 rounded-pill d-flex align-items-center gap-2"
              >
                <i className="bi bi-scissors"></i> Crop & Apply
              </button>
            </div>
          </div>

          {/* Interactive Canvas Viewport */}
          <div
            className="my-4 overflow-hidden rounded border bg-body-tertiary d-flex align-items-center justify-content-center"
            style={{ maxHeight: '500px' }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source"
              style={{ maxWidth: '100%', display: 'block' }}
            />
          </div>

          {/* Crop Output / Download */}
          {cropResultUrl && (
            <div className="alert alert-success d-flex align-items-center justify-content-between mb-0 rounded-3">
              <div className="d-flex align-items-center gap-3">
                <img
                  src={cropResultUrl}
                  alt="Result"
                  className="rounded border"
                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                />
                <div>
                  <h6 className="mb-0 fw-bold">Image Cropped Successfully</h6>
                  <small className="text-secondary">Exported as lossless PNG</small>
                </div>
              </div>

              <a
                href={cropResultUrl}
                download={`${selectedFile?.name.split('.')[0] || 'edited'}_snapcat.png`}
                className="btn btn-success px-4 rounded-pill d-flex align-items-center gap-2"
              >
                <i className="bi bi-download"></i> Download Image
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}