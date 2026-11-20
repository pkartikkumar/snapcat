import * as ort from 'onnxruntime-web';
import { createLocalSession } from './onnxHelper';

const INPAINT_MODEL_URL =
  'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx';

export async function runInpainting(imageCanvas, maskCanvas) {
  const session = await createLocalSession(INPAINT_MODEL_URL);
  const size = 512;

  const tmpImg = document.createElement('canvas');
  const tmpMask = document.createElement('canvas');
  tmpImg.width = tmpMask.width = size;
  tmpImg.height = tmpMask.height = size;

  const imgCtx = tmpImg.getContext('2d');
  const maskCtx = tmpMask.getContext('2d');
  imgCtx.drawImage(imageCanvas, 0, 0, size, size);
  maskCtx.drawImage(maskCanvas, 0, 0, size, size);

  const imgPixels = imgCtx.getImageData(0, 0, size, size).data;
  const maskPixels = maskCtx.getImageData(0, 0, size, size).data;

  const imgTensorData = new Float32Array(3 * size * size);
  const maskTensorData = new Float32Array(1 * size * size);

  for (let i = 0; i < size * size; i++) {
    imgTensorData[i] = imgPixels[i * 4] / 255.0;
    imgTensorData[size * size + i] = imgPixels[i * 4 + 1] / 255.0;
    imgTensorData[2 * size * size + i] = imgPixels[i * 4 + 2] / 255.0;
    maskTensorData[i] = maskPixels[i * 4 + 3] > 20 ? 1.0 : 0.0;
  }

  const results = await session.run({
    image: new ort.Tensor('float32', imgTensorData, [1, 3, size, size]),
    mask: new ort.Tensor('float32', maskTensorData, [1, 1, size, size]),
  });

  const outData = results[session.outputNames[0]].data;
  const outImgData = imgCtx.createImageData(size, size);

  for (let i = 0; i < size * size; i++) {
    const scale = outData[i] <= 1.5 ? 255 : 1;
    outImgData.data[i * 4] = Math.min(255, Math.max(0, outData[i] * scale));
    outImgData.data[i * 4 + 1] = Math.min(255, Math.max(0, outData[size * size + i] * scale));
    outImgData.data[i * 4 + 2] = Math.min(255, Math.max(0, outData[2 * size * size + i] * scale));
    outImgData.data[i * 4 + 3] = 255;
  }

  imgCtx.putImageData(outImgData, 0, 0);

  // Blend only the masked area back onto full-resolution original image
  const maskOverlay = document.createElement('canvas');
  maskOverlay.width = imageCanvas.width;
  maskOverlay.height = imageCanvas.height;
  const moCtx = maskOverlay.getContext('2d');
  moCtx.drawImage(tmpImg, 0, 0, imageCanvas.width, imageCanvas.height);
  moCtx.globalCompositeOperation = 'destination-in';
  moCtx.drawImage(maskCanvas, 0, 0);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = imageCanvas.width;
  finalCanvas.height = imageCanvas.height;
  const finalCtx = finalCanvas.getContext('2d');
  finalCtx.drawImage(imageCanvas, 0, 0);
  finalCtx.drawImage(maskOverlay, 0, 0);

  return finalCanvas;
}