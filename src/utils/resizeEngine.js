import { decodeToBitmap } from './imageEngine';
import JSZip from 'jszip';

/**
 * Resizes a single image file based on pixels or scale percentage.
 */
export async function resizeSingleImage(file, options = {}) {
  const {
    mode = 'pixels', // 'pixels' | 'percent'
    targetWidth = null,
    targetHeight = null,
    scalePercent = 50,
    maintainAspectRatio = true,
    outputFormat = 'image/png', // default to png to maintain transparency
  } = options;

  // If it's an SVG and user just wants to pass through or scale
  if (file.type === 'image/svg+xml') {
    // For SVGs, return with new name or rasterize
    const text = await file.text();
    const blob = new Blob([text], { type: 'image/svg+xml' });
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: `${file.name.replace(/\.[^/.]+$/, '')}_resized.svg`,
      originalWidth: 'Vector',
      originalHeight: 'Vector',
      newWidth: targetWidth || 'Vector',
      newHeight: targetHeight || 'Vector',
      originalSize: file.size,
      newSize: blob.size,
      blob,
      previewUrl: URL.createObjectURL(blob),
    };
  }

  const bitmap = await decodeToBitmap(file);
  const origW = bitmap.width;
  const origH = bitmap.height;

  let finalW = origW;
  let finalH = origH;

  if (mode === 'percent') {
    const factor = scalePercent / 100;
    finalW = Math.max(1, Math.round(origW * factor));
    finalH = Math.max(1, Math.round(origH * factor));
  } else {
    // Exact pixels mode
    if (maintainAspectRatio) {
      if (targetWidth && !targetHeight) {
        finalW = targetWidth;
        finalH = Math.round((origH / origW) * targetWidth);
      } else if (!targetWidth && targetHeight) {
        finalH = targetHeight;
        finalW = Math.round((origW / origH) * targetHeight);
      } else if (targetWidth && targetHeight) {
        // fit inside box maintaining ratio
        const ratio = Math.min(targetWidth / origW, targetHeight / origH);
        finalW = Math.round(origW * ratio);
        finalH = Math.round(origH * ratio);
      }
    } else {
      finalW = targetWidth || origW;
      finalH = targetHeight || origH;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  // Fill white if user specifically requests JPEG
  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, finalW, finalH);
  }

  // High quality bicubic resampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, finalW, finalH);
  bitmap.close();

  const exportBlob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), outputFormat, 0.92);
  });

  const ext = outputFormat.split('/')[1];
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `${baseName}_${finalW}x${finalH}.${ext}`,
    originalWidth: origW,
    originalHeight: origH,
    newWidth: finalW,
    newHeight: finalH,
    originalSize: file.size,
    newSize: exportBlob.size,
    blob: exportBlob,
    previewUrl: URL.createObjectURL(exportBlob),
  };
}

/**
 * Bundles resized images into a ZIP.
 */
export async function bundleResizedZip(items) {
  const zip = new JSZip();
  items.forEach((item) => {
    zip.file(item.name, item.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
}