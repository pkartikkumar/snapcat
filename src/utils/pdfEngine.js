import { jsPDF } from 'jspdf';
import { decodeToBitmap } from './imageEngine';

/**
 * Compiles multiple images into a multi-page A4 PDF.
 */
export async function convertImagesToPDF(files, orientation = 'portrait') {
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i++) {
    if (i > 0) pdf.addPage();

    const bitmap = await decodeToBitmap(files[i]);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(bitmap, 0, 0);

    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    bitmap.close();

    // Preserve aspect ratio inside standard 24pt margins
    const margin = 24;
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2;

    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const renderW = canvas.width * ratio;
    const renderH = canvas.height * ratio;
    const x = (pageWidth - renderW) / 2;
    const y = (pageHeight - renderH) / 2;

    pdf.addImage(imgDataUrl, 'JPEG', x, y, renderW, renderH);
  }

  return pdf.output('blob');
}