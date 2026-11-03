import JSZip from 'jszip';

/**
 * Robust image decoder: automatically handles HEIC/HEIF, falling back
 * safely to native createImageBitmap.
 */
export async function decodeToBitmap(file) {
  let imageSource = file;

  // Handle Apple HEIC/HEIF photos dynamically
  const isHeic = 
    file.type.includes('heic') || 
    file.type.includes('heif') || 
    file.name.toLowerCase().endsWith('.heic') || 
    file.name.toLowerCase().endsWith('.heif');

  if (isHeic) {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({
      blob: file,
      toType: 'image/png',
    });
    imageSource = Array.isArray(converted) ? converted[0] : converted;
  }

  return await createImageBitmap(imageSource);
}

/**
 * Converts any image to PNG, JPEG, or WebP with adjustable quality.
 */
export async function convertSingleImage(file, targetFormat = 'image/webp', quality = 0.85) {
  const bitmap = await decodeToBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not access canvas context');

  // Fill white background for JPEG exports to prevent black edges on transparent images
  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close(); // Clean up GPU memory immediately

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      targetFormat,
      quality
    );
  });

  const extension = targetFormat.split('/')[1];
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `${baseName}_snapcat.${extension}`,
    originalSize: file.size,
    newSize: blob.size,
    blob,
    previewUrl: URL.createObjectURL(blob),
  };
}

/**
 * Transparent PNG Maker: Removes solid colors (like white or green) using RGB delta tolerance.
 */
export async function makeTransparentPNG(file, targetColor = { r: 255, g: 255, b: 255 }, tolerance = 25) {
  const bitmap = await decodeToBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not access canvas context');

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Pixel layout: [R, G, B, A,  R, G, B, A, ...]
  for (let i = 0; i < data.length; i += 4) {
    const rDiff = Math.abs(data[i] - targetColor.r);
    const gDiff = Math.abs(data[i + 1] - targetColor.g);
    const bDiff = Math.abs(data[i + 2] - targetColor.b);

    if (rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance) {
      data[i + 3] = 0; // Alpha = 0 (Transparent)
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('PNG export failed'))),
      'image/png'
    );
  });

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `${baseName}_transparent.png`,
    originalSize: file.size,
    newSize: blob.size,
    blob,
    previewUrl: URL.createObjectURL(blob),
  };
}

/**
 * Bundles processed files into a single ZIP file for batch download.
 */
export async function bundleIntoZip(items) {
  const zip = new JSZip();
  items.forEach((item) => {
    zip.file(item.name, item.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
}