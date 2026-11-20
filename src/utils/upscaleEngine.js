import * as ort from 'onnxruntime-web';
import { createLocalSession } from './onnxHelper';

const UPSCALE_MODEL_URL =
  'https://huggingface.co/fernandotonon/QtMeshEditor-realesrgan-onnx/resolve/main/RealESRGAN_x4plus.onnx';

export async function upscaleImageFile(file, onProgress) {
  const imgBitmap = await createImageBitmap(file);
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imgBitmap.width;
  sourceCanvas.height = imgBitmap.height;
  sourceCanvas.getContext('2d').drawImage(imgBitmap, 0, 0);

  const session = await createLocalSession(UPSCALE_MODEL_URL);
  const scale = 4;
  const tileSize = 64;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = w * scale;
  outCanvas.height = h * scale;
  const outCtx = outCanvas.getContext('2d');

  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = tileSize;
  tileCanvas.height = tileSize;
  const tileCtx = tileCanvas.getContext('2d');

  const cols = Math.ceil(w / tileSize);
  const rows = Math.ceil(h / tileSize);
  let done = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize;
      const y = r * tileSize;
      const tw = Math.min(tileSize, w - x);
      const th = Math.min(tileSize, h - y);

      tileCtx.clearRect(0, 0, tileSize, tileSize);
      tileCtx.drawImage(sourceCanvas, x, y, tw, th, 0, 0, tw, th);

      const imgData = tileCtx.getImageData(0, 0, tileSize, tileSize).data;
      const floatData = new Float32Array(3 * tileSize * tileSize);

      for (let i = 0; i < tileSize * tileSize; i++) {
        floatData[i] = imgData[i * 4] / 255.0;
        floatData[tileSize * tileSize + i] = imgData[i * 4 + 1] / 255.0;
        floatData[2 * tileSize * tileSize + i] = imgData[i * 4 + 2] / 255.0;
      }

      const inputTensor = new ort.Tensor('float32', floatData, [1, 3, tileSize, tileSize]);
      const results = await session.run({ [session.inputNames[0]]: inputTensor });
      const outTensor = results[session.outputNames[0]];
      const output = outTensor.data;
      const dims = outTensor.dims;

      // Detect NHWC [1, H, W, 3] vs NCHW [1, 3, H, W]
      const isNHWC = dims.length === 4 && dims[3] === 3;
      const fullOutSize = tileSize * scale;
      const outW = tw * scale;
      const outH = th * scale;
      const tileOut = outCtx.createImageData(outW, outH);

      for (let row = 0; row < outH; row++) {
        for (let col = 0; col < outW; col++) {
          const pixelIdx = row * fullOutSize + col;
          const dstIdx = (row * outW + col) * 4;

          let rVal, gVal, bVal;
          if (isNHWC) {
            rVal = output[pixelIdx * 3];
            gVal = output[pixelIdx * 3 + 1];
            bVal = output[pixelIdx * 3 + 2];
          } else {
            rVal = output[pixelIdx];
            gVal = output[fullOutSize * fullOutSize + pixelIdx];
            bVal = output[2 * fullOutSize * fullOutSize + pixelIdx];
          }

          tileOut.data[dstIdx] = Math.min(255, Math.max(0, rVal * 255));
          tileOut.data[dstIdx + 1] = Math.min(255, Math.max(0, gVal * 255));
          tileOut.data[dstIdx + 2] = Math.min(255, Math.max(0, bVal * 255));
          tileOut.data[dstIdx + 3] = 255;
        }
      }

      outCtx.putImageData(tileOut, x * scale, y * scale);
      done++;
      if (onProgress) onProgress(Math.round((done / (rows * cols)) * 100));

      // Yield a frame to keep the UI progress bar responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return new Promise((resolve) => {
    outCanvas.toBlob((blob) => {
      resolve({
        blob,
        url: URL.createObjectURL(blob),
        width: outCanvas.width,
        height: outCanvas.height,
      });
    }, 'image/png');
  });
}