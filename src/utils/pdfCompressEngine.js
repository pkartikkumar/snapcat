import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { jsPDF } from 'jspdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const PDF_PRESETS = {
  extreme: {
    label: 'Maximum Compression (Smallest KB)',
    desc: 'Best for strict 100 KB – 200 KB government/exam portal limits',
    scale: 1.0, // ~72 DPI
    quality: 0.45,
  },
  recommended: {
    label: 'Recommended (Balanced Quality & Size)',
    desc: 'Crisp readable text & IDs with 60–80% size reduction',
    scale: 1.4, // ~100 DPI
    quality: 0.65,
  },
  high: {
    label: 'Light Compression (High Clarity)',
    desc: 'Preserves fine print and signatures at ~144 DPI',
    scale: 2.0, // ~144 DPI
    quality: 0.82,
  },
};

export async function compressPdfFile(file, options = {}, onProgress) {
  const { scale = 1.4, quality = 0.65, grayscale = false } = options;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  let outPdf = null;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    // Fill white background so transparent PDFs don't turn black in JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Optional grayscale conversion for scanned documents (reduces size further)
    if (grayscale) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);

    // Preserve original page aspect ratio in points (72 pt = 1 inch)
    const origViewport = page.getViewport({ scale: 1.0 });
    const ptWidth = origViewport.width;
    const ptHeight = origViewport.height;
    const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

    if (pageNum === 1) {
      outPdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [ptWidth, ptHeight],
        compress: true,
      });
    } else {
      outPdf.addPage([ptWidth, ptHeight], orientation);
    }

    outPdf.addImage(jpegDataUrl, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');

    if (onProgress) {
      onProgress(Math.round((pageNum / totalPages) * 100));
    }

    // Yield UI thread between pages
    await new Promise((r) => setTimeout(r, 0));
  }

  const blob = outPdf.output('blob');
  return {
    blob,
    url: URL.createObjectURL(blob),
    compressedSize: blob.size,
    originalSize: file.size,
    pageCount: totalPages,
  };
}