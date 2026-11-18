import * as ort from 'onnxruntime-web';
import { createLocalSession } from './onnxHelper';

export async function upscaleImageFile(file, onProgress) {
  const imgBitmap = await createImageBitmap(file);
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imgBitmap.width;
  sourceCanvas.height = imgBitmap.height;
  sourceCanvas.getContext('2d').drawImage(imgBitmap, 0, 0);

  const session = await createLocalSession('/models/realesrgan-x4.onnx');
  const scale = 4;
  const tileSize = 128;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = w * scale;
  outCanvas.height = h * scale;
  const outCtx = outCanvas.getContext('2d');
  const srcCtx = sourceCanvas.getContext('2d');

  const cols = Math.ceil(w / tileSize);
  const rows = Math.ceil(h / tileSize);
  let done = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize;
      const y = r * tileSize;
      const tw = Math.min(tileSize, w - x);
      const th = Math.min(tileSize, h - y);

      const imgData = srcCtx.getImageData(x, y, tw, th).data;
      const floatData = new Float32Array(3 * tw * th);

      for (let i = 0; i < tw * th; i++) {
        floatData[i] = imgData[i * 4] / 255.0;
        floatData[tw * th + i] = imgData[i * 4 + 1] / 255.0;
        floatData[2 * tw * th + i] = imgData[i * 4 + 2] / 255.0;
      }

      const inputTensor = new ort.Tensor('float32', floatData, [1, 3, th, tw]);
      const results = await session.run({ [session.inputNames[0]]: inputTensor });
      const output = results[session.outputNames[0]].data;

      const outW = tw * scale;
      const outH = th * scale;
      const tileOut = outCtx.createImageData(outW, outH);

      for (let i = 0; i < outW * outH; i++) {
        tileOut.data[i * 4] = Math.min(255, Math.max(0, output[i] * 255));
        tileOut.data[i * 4 + 1] = Math.min(255, Math.max(0, output[outW * outH + i] * 255));
        tileOut.data[i * 4 + 2] = Math.min(255, Math.max(0, output[2 * outW * outH + i] * 255));
        tileOut.data[i * 4 + 3] = 255;
      }

      outCtx.putImageData(tileOut, x * scale, y * scale);
      done++;
      if (onProgress) onProgress(Math.round((done / (rows * cols)) * 100));
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