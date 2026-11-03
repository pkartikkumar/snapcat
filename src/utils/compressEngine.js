import { decodeToBitmap } from './imageEngine';
import JSZip from 'jszip';

/**
 * Aggressive adaptive compressor capable of hitting micro-file sizes (e.g., 5 KB, 10 KB, 20 KB)
 * by dynamically resizing dimensions and binary-searching JPEG/WebP quality.
 */
export async function compressSingleImage(file, options = {}) {
  const {
    quality = 0.75,
    maxWidth = 1920,
    maxHeight = 1920,
    targetMaxKb = null, // e.g. 5 for 5 KB
    outputFormat = 'image/jpeg',
  } = options;

  const bitmap = await decodeToBitmap(file);

  let currentWidth = bitmap.width;
  let currentHeight = bitmap.height;

  // Initial constraint
  if (currentWidth > maxWidth || currentHeight > maxHeight) {
    const ratio = Math.min(maxWidth / currentWidth, maxHeight / currentHeight);
    currentWidth = Math.round(currentWidth * ratio);
    currentHeight = Math.round(currentHeight * ratio);
  }

  // If targeting <= 10 KB, immediately cap maximum dimensions to prevent wasted iterations
  if (targetMaxKb && targetMaxKb <= 10) {
    const microLimit = targetMaxKb <= 5 ? 200 : 350; // max 200px for <= 5KB
    if (currentWidth > microLimit || currentHeight > microLimit) {
      const ratio = Math.min(microLimit / currentWidth, microLimit / currentHeight);
      currentWidth = Math.max(30, Math.round(currentWidth * ratio));
      currentHeight = Math.max(30, Math.round(currentHeight * ratio));
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const renderToBlob = (w, h, q) => {
    canvas.width = w;
    canvas.height = h;

    if (outputFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    ctx.drawImage(bitmap, 0, 0, w, h);

    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), outputFormat, q);
    });
  };

  let currentQuality = quality;
  let blob = await renderToBlob(currentWidth, currentHeight, currentQuality);

  // Aggressive Multi-Pass Loop for target KB
  if (targetMaxKb && blob.size > targetMaxKb * 1024) {
    const targetBytes = targetMaxKb * 1024;
    let attempts = 0;

    // Phase 1: Binary search quality on current dimensions
    let minQ = 0.05;
    let maxQ = currentQuality;

    while (attempts < 6 && minQ < maxQ) {
      currentQuality = (minQ + maxQ) / 2;
      blob = await renderToBlob(currentWidth, currentHeight, currentQuality);

      if (blob.size > targetBytes) {
        maxQ = currentQuality - 0.05;
      } else {
        minQ = currentQuality + 0.05;
      }
      attempts++;
    }

    // Phase 2: If still > targetBytes (e.g., trying to hit 5 KB), step down dimensions
    attempts = 0;
    while (blob.size > targetBytes && attempts < 8 && currentWidth > 40 && currentHeight > 40) {
      // Step down resolution by 15% each iteration
      currentWidth = Math.round(currentWidth * 0.85);
      currentHeight = Math.round(currentHeight * 0.85);
      
      // Try low-to-mid quality on smaller resolution
      currentQuality = Math.max(0.2, currentQuality);
      blob = await renderToBlob(currentWidth, currentHeight, currentQuality);
      attempts++;
    }
  }

  bitmap.close(); // Clean up GPU memory

  const ext = outputFormat.split('/')[1];
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `${baseName}_${targetMaxKb ? targetMaxKb + 'kb' : 'compressed'}.${ext}`,
    originalSize: file.size,
    newSize: blob.size,
    blob,
    previewUrl: URL.createObjectURL(blob),
  };
}

/**
 * Bundles compressed files into a single ZIP for batch downloads.
 */
export async function bundleCompressedZip(items) {
  const zip = new JSZip();
  items.forEach((item) => {
    zip.file(item.name, item.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
}