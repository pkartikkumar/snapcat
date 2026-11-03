import { removeBackground } from '@imgly/background-removal';

/**
 * Executes AI Salient Object Segmentation in the browser via WebAssembly.
 * Automatically identifies humans, products, animals, and items without color keying.
 */
export async function autoRemoveBackground(file, onProgress) {
  const config = {
    progress: (key, current, total) => {
      if (onProgress && total > 0) {
        const percent = Math.round((current / total) * 100);
        onProgress(percent);
      }
    },
    output: {
      format: 'image/png',
      quality: 1.0,
    },
  };

  const transparentBlob = await removeBackground(file, config);
  return transparentBlob;
}

/**
 * Trims empty transparent padding surrounding the subject so the PNG is tightly bounded.
 */
export async function trimTransparentPadding(imageBlob) {
  const imgBitmap = await createImageBitmap(imageBlob);
  const canvas = document.createElement('canvas');
  canvas.width = imgBitmap.width;
  canvas.height = imgBitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgBitmap, 0, 0);
  imgBitmap.close();

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  let foundPixel = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > 5) { // Visible pixel threshold
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        foundPixel = true;
      }
    }
  }

  if (!foundPixel) return imageBlob;

  const trimW = Math.max(1, maxX - minX + 1);
  const trimH = Math.max(1, maxY - minY + 1);

  const trimCanvas = document.createElement('canvas');
  trimCanvas.width = trimW;
  trimCanvas.height = trimH;
  const trimCtx = trimCanvas.getContext('2d');

  trimCtx.drawImage(
    canvas,
    minX, minY, trimW, trimH,
    0, 0, trimW, trimH
  );

  return new Promise((resolve) => {
    trimCanvas.toBlob((blob) => resolve(blob || imageBlob), 'image/png');
  });
}

/**
 * Composites the transparent cutout on top of a solid color or custom background image.
 */
export async function compositeWithBackground(cutoutBlob, bgConfig) {
  // If transparent grid is selected, return the raw cutout blob
  if (bgConfig.type === 'transparent') {
    return cutoutBlob;
  }

  const cutoutBitmap = await createImageBitmap(cutoutBlob);
  const canvas = document.createElement('canvas');
  canvas.width = cutoutBitmap.width;
  canvas.height = cutoutBitmap.height;
  const ctx = canvas.getContext('2d');

  if (bgConfig.type === 'color') {
    // 1. Fill solid background color
    ctx.fillStyle = bgConfig.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (bgConfig.type === 'image' && bgConfig.imageFile) {
    // 2. Draw custom background image (cover mode)
    const bgBitmap = await createImageBitmap(bgConfig.imageFile);
    
    // Calculate aspect-fill dimensions
    const hRatio = canvas.width / bgBitmap.width;
    const vRatio = canvas.height / bgBitmap.height;
    const ratio = Math.max(hRatio, vRatio);

    const centerShiftX = (canvas.width - bgBitmap.width * ratio) / 2;
    const centerShiftY = (canvas.height - bgBitmap.height * ratio) / 2;

    ctx.drawImage(
      bgBitmap,
      0, 0, bgBitmap.width, bgBitmap.height,
      centerShiftX, centerShiftY, bgBitmap.width * ratio, bgBitmap.height * ratio
    );
    bgBitmap.close();
  }

  // 3. Draw the transparent cutout on top
  ctx.drawImage(cutoutBitmap, 0, 0);
  cutoutBitmap.close();

  // Export as PNG (or JPEG if solid color)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}