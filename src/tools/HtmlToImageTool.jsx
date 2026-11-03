import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';

const VIEWPORT_PRESETS = [
  { label: 'Desktop (1920×1080)', width: 1920, height: 1080, icon: 'bi-display' },
  { label: 'Laptop (1366×768)', width: 1366, height: 768, icon: 'bi-laptop' },
  { label: 'Tablet (768×1024)', width: 768, height: 1024, icon: 'bi-tablet' },
  { label: 'Mobile (375×812)', width: 375, height: 812, icon: 'bi-phone' },
];

export default function HtmlToImageTool() {
  const [mode, setMode] = useState('url'); // 'url' | 'html'
  
  // URL Mode state
  const [urlInput, setUrlInput] = useState('https://github.com');
  const [viewport, setViewport] = useState(VIEWPORT_PRESETS[0]);
  const [fullPage, setFullPage] = useState(false);
  const [exportFormat, setExportFormat] = useState('jpeg'); // 'jpeg' | 'png' | 'svg'

  // Code Mode state
  const [htmlCode, setHtmlCode] = useState(
    `<div style="padding: 32px; background: #0f172a; color: white; border-radius: 12px; font-family: sans-serif;">\n  <h2 style="color: #f97316; margin: 0;">SnapCat Card</h2>\n  <p style="color: #94a3b8; margin-top: 8px;">Client-side rendered vector card</p>\n</div>`
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);

  // Clean URL helper
  const cleanUrl = (input) => {
    let target = input.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    return target;
  };

  const handleCaptureUrl = async () => {
    const targetUrl = cleanUrl(urlInput);
    setIsProcessing(true);
    setResultUrl(null);
    setCapturedBlob(null);

    try {
      // Free public client-accessible screenshot pipeline with exact viewport dimensions
      // Format options: jpg, png
      const formatExt = exportFormat === 'svg' ? 'png' : exportFormat;
      const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(
        targetUrl
      )}&screenshot=true&meta=false&viewport.width=${viewport.width}&viewport.height=${viewport.height}&screenshot.fullPage=${fullPage}&type=${formatExt}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 'fail' || !data.data?.screenshot?.url) {
        throw new Error(data.message || 'Failed to capture screenshot from URL. Verify the URL is reachable.');
      }

      // Fetch the binary image blob locally so user gets direct zero-hop file saving
      const imgRes = await fetch(data.data.screenshot.url);
      const blob = await imgRes.blob();

      setCapturedBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert('Capture Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureHtml = async () => {
    const tempContainer = document.getElementById('snapcat-html-render-target');
    if (!tempContainer) return;

    setIsProcessing(true);
    setResultUrl(null);

    try {
      let dataUrl;
      const opts = { pixelRatio: 2, cacheBust: true };

      if (exportFormat === 'svg') {
        dataUrl = await htmlToImage.toSvg(tempContainer, opts);
      } else if (exportFormat === 'png') {
        dataUrl = await htmlToImage.toPng(tempContainer, opts);
      } else {
        dataUrl = await htmlToImage.toJpeg(tempContainer, { ...opts, quality: 0.92, backgroundColor: '#ffffff' });
      }

      setResultUrl(dataUrl);
    } catch (err) {
      alert('Render Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card border-0 bg-body shadow-sm rounded-4 p-4">
      {/* Top Controls Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
        {/* Mode Selector */}
        <div className="btn-group btn-group-sm p-1 bg-body-tertiary rounded-pill border" role="group">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`btn rounded-pill px-3 ${mode === 'url' ? 'btn-snapcat' : 'btn-light text-body'}`}
          >
            <i className="bi bi-globe2 me-1"></i> Web Page URL
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={`btn rounded-pill px-3 ${mode === 'html' ? 'btn-snapcat' : 'btn-light text-body'}`}
          >
            <i className="bi bi-code-slash me-1"></i> Raw HTML & CSS
          </button>
        </div>

        {/* Global Export Options */}
        <div className="d-flex flex-wrap align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="small text-secondary">Format:</span>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="form-select form-select-sm"
              style={{ width: '100px' }}
            >
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              {mode === 'html' && <option value="svg">SVG</option>}
            </select>
          </div>

          <button
            onClick={mode === 'url' ? handleCaptureUrl : handleCaptureHtml}
            disabled={isProcessing}
            className="btn btn-snapcat px-4 rounded-pill d-flex align-items-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Capturing Web Page...
              </>
            ) : (
              <>
                <i className="bi bi-camera-fill"></i> Convert to Image
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODE 1: URL BASED SCREENSHOT */}
      {mode === 'url' ? (
        <div className="my-4">
          <label className="form-label fw-bold text-body mb-2">Web Page URL</label>
          <div className="input-group mb-3">
            <span className="input-group-text bg-body-tertiary">
              <i className="bi bi-link-45deg fs-5"></i>
            </span>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://wikipedia.org or https://stripe.com"
              className="form-control form-control-lg bg-body text-body"
            />
          </div>

          {/* Viewport Presets & Full-page Toggle */}
          <div className="row g-3 align-items-center bg-body-tertiary p-3 rounded-3 mb-4">
            <div className="col-12 col-md-6">
              <span className="small text-secondary fw-semibold d-block mb-2">Screen Viewport:</span>
              <div className="d-flex flex-wrap gap-2">
                {VIEWPORT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setViewport(p)}
                    className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 ${
                      viewport.label === p.label ? 'btn-secondary fw-bold' : 'btn-outline-secondary'
                    }`}
                  >
                    <i className={`bi ${p.icon}`}></i>
                    <span>{p.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-12 col-md-6 d-flex justify-content-md-end align-items-center">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="fullPageSwitch"
                  checked={fullPage}
                  onChange={(e) => setFullPage(e.target.checked)}
                />
                <label className="form-check-label small text-body fw-semibold" htmlFor="fullPageSwitch">
                  Capture Full Scrollable Page
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: RAW HTML CODE INPUT */
        <div className="row g-3 my-3">
          <div className="col-12 col-lg-6">
            <span className="small fw-semibold text-secondary mb-2 d-block">HTML Markup</span>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="form-control font-monospace small bg-body-tertiary"
              rows="12"
              placeholder="Paste HTML with inline styles..."
            />
          </div>

          <div className="col-12 col-lg-6">
            <span className="small fw-semibold text-secondary mb-2 d-block">Preview</span>
            <div
              className="rounded border p-3 bg-body-tertiary d-flex align-items-center justify-content-center overflow-auto"
              style={{ minHeight: '300px' }}
            >
              <div id="snapcat-html-render-target" dangerouslySetInnerHTML={{ __html: htmlCode }} />
            </div>
          </div>
        </div>
      )}

      {/* Captured Image Result & Download Area */}
      {resultUrl && (
        <div className="card border-0 bg-body-tertiary rounded-4 p-4 mt-2">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom mb-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-success fs-4"></i>
              <div>
                <h6 className="mb-0 fw-bold text-body">Snapshot Generated</h6>
                <small className="text-secondary">
                  {mode === 'url' ? `${viewport.width}×${viewport.height} Viewport` : 'Vector Rendered'}
                </small>
              </div>
            </div>

            <a
              href={resultUrl}
              download={`snapcat_web_snapshot.${exportFormat === 'jpeg' ? 'jpg' : exportFormat}`}
              className="btn btn-success px-4 rounded-pill d-flex align-items-center gap-2"
            >
              <i className="bi bi-download"></i> Download Image
            </a>
          </div>

          {/* Snapshot Preview Viewport */}
          <div
            className="rounded border bg-body overflow-auto text-center p-2"
            style={{ maxHeight: '480px' }}
          >
            <img
              src={resultUrl}
              alt="Snapshot"
              className="img-fluid rounded shadow-sm"
              style={{ maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}