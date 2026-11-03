import { decodeToBitmap } from './imageEngine';
import JSZip from 'jszip';

function calculatePosition(pos, canvasW, canvasH, itemW, itemH, margin = 32) {
  let x = margin;
  let y = margin;

  // Horizontal
  if (pos.includes('center') || pos === 'top' || pos === 'bottom') {
    x = (canvasW - itemW) / 2;
  } else if (pos.includes('right')) {
    x = canvasW - itemW - margin;
  }

  // Vertical
  if (pos.includes('middle') || pos === 'center') {
    y = (canvasH - itemH) / 2;
  } else if (pos.includes('bottom')) {
    y = canvasH - itemH - margin;
  }

  return { x, y };
}

/**
 * Applies watermark with lossless/maximum-fidelity canvas sampling.
 */
export async function applyWatermark(file, config = {}) {
  const {
    type = 'text',
    text = '© SnapCat Private',
    fontSize = 48,
    fontFamily = 'system-ui, -apple-system, sans-serif',
    textColor = '#ffffff',
    logoFile = null,
    logoScale = 20,
    opacity = 0.7,
    position = 'bottom-right',
    rotation = 0,
    tile = false,
  } = config;

  const baseBitmap = await decodeToBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = baseBitmap.width;
  canvas.height = baseBitmap.height;

  const ctx = canvas.getContext('2d', {
    alpha: true,
    willReadFrequently: false,
    colorSpace: 'srgb',
  });
  if (!ctx) throw new Error('Canvas context unavailable');

  // 1. High-fidelity rendering configuration
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 2. Draw base image untouched
  ctx.drawImage(baseBitmap, 0, 0);
  baseBitmap.close();

  ctx.save();
  ctx.globalAlpha = opacity;

  if (type === 'text') {
    // Dynamic scale so font looks crisp on 4K/high-res photos
    const baseScaleFactor = Math.max(1, canvas.width / 1920);
    const scaledFontSize = Math.round(fontSize * baseScaleFactor);

    ctx.font = `bold ${scaledFontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';

    // Subtle drop shadow for crisp readability against any background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6 * baseScaleFactor;
    ctx.shadowOffsetX = 2 * baseScaleFactor;
    ctx.shadowOffsetY = 2 * baseScaleFactor;

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = scaledFontSize;

    if (tile) {
      const stepX = textW * 1.8;
      const stepY = textH * 4;
      ctx.rotate((-30 * Math.PI) / 180);
      for (let x = -canvas.width * 1.5; x < canvas.width * 2.5; x += stepX) {
        for (let y = -canvas.height * 1.5; y < canvas.height * 2.5; y += stepY) {
          ctx.fillText(text, x, y);
        }
      }
    } else {
      const margin = 32 * baseScaleFactor;
      const { x, y } = calculatePosition(position, canvas.width, canvas.height, textW, textH, margin);

      ctx.translate(x + textW / 2, y + textH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(text, -textW / 2, 0);
    }
  } else if (type === 'image' && logoFile) {
    const logoBitmap = await decodeToBitmap(logoFile);
    const targetW = canvas.width * (logoScale / 100);
    const targetH = (logoBitmap.height / logoBitmap.width) * targetW;

    if (tile) {
      const stepX = targetW * 1.6;
      const stepY = targetH * 1.6;
      ctx.rotate((-25 * Math.PI) / 180);
      for (let x = -canvas.width * 1.5; x < canvas.width * 2.5; x += stepX) {
        for (let y = -canvas.height * 1.5; y < canvas.height * 2.5; y += stepY) {
          ctx.drawImage(logoBitmap, x, y, targetW, targetH);
        }
      }
    } else {
      const baseScaleFactor = Math.max(1, canvas.width / 1920);
      const margin = 32 * baseScaleFactor;
      const { x, y } = calculatePosition(position, canvas.width, canvas.height, targetW, targetH, margin);

      ctx.translate(x + targetW / 2, y + targetH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(logoBitmap, -targetW / 2, -targetH / 2, targetW, targetH);
    }
    logoBitmap.close();
  }

  ctx.restore();

  // 3. Preserve original format (PNG stays lossless PNG, JPEG stays JPEG at 0.98 quality)
  let exportMime = 'image/png';
  let ext = 'png';

  if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
    exportMime = 'image/jpeg';
    ext = 'jpg';
  } else if (file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')) {
    exportMime = 'image/webp';
    ext = 'webp';
  }

  const exportBlob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), exportMime, 0.98);
  });

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `${baseName}_watermarked.${ext}`,
    originalSize: file.size,
    newSize: exportBlob.size,
    blob: exportBlob,
    previewUrl: URL.createObjectURL(exportBlob),
  };
}

export async function bundleWatermarkedZip(items) {
  const zip = new JSZip();
  items.forEach((item) => {
    zip.file(item.name, item.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
}