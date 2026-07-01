import html2canvas from 'html2canvas-pro';
// @ts-ignore
import { jsPDF } from 'jspdf/dist/jspdf.es.min.js';

interface PdfOptions {
  margin?: [number, number, number, number];
  filename?: string;
  scale?: number;
}

export async function generatePdfFromHtml(element: HTMLElement, options: PdfOptions = {}) {
  const margin = options.margin || [10, 10, 10, 10]; // top, left, bottom, right in mm
  const filename = options.filename || 'document.pdf';
  const scale = options.scale || 2;

  await document.fonts?.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Render element to canvas using html2canvas-pro
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 10000,
  });

  // Page dimensions configuration (A4 format)
  // A4 size: 210mm x 297mm
  const a4Width = 210;
  const a4Height = 297;
  
  const innerWidth = a4Width - margin[1] - margin[3];
  const innerHeight = a4Height - margin[0] - margin[2];
  const innerRatio = innerHeight / innerWidth;

  const pxFullHeight = canvas.height;
  const pxPageHeight = Math.floor(canvas.width * innerRatio);
  const nPages = Math.ceil(pxFullHeight / pxPageHeight);

  // Initialize jsPDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Create a single-page canvas to segment the full canvas
  const pageCanvas = document.createElement('canvas');
  const pageCtx = pageCanvas.getContext('2d');
  if (!pageCtx) {
    throw new Error('Failed to get 2d context for page canvas');
  }

  pageCanvas.width = canvas.width;
  pageCanvas.height = pxPageHeight;

  let pageHeight = innerHeight;

  for (let page = 0; page < nPages; page++) {
    // For the last page, trim the page canvas height if there is remaining content
    if (page === nPages - 1 && pxFullHeight % pxPageHeight !== 0) {
      pageCanvas.height = pxFullHeight % pxPageHeight;
      pageHeight = (pageCanvas.height * innerWidth) / pageCanvas.width;
    } else {
      pageCanvas.height = pxPageHeight;
      pageHeight = innerHeight;
    }

    // Fill page background with white
    pageCtx.fillStyle = '#ffffff';
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    // Draw the segment of the original canvas onto the page canvas
    pageCtx.drawImage(
      canvas,
      0,
      page * pxPageHeight,
      canvas.width,
      pageCanvas.height,
      0,
      0,
      canvas.width,
      pageCanvas.height
    );

    // Add page to PDF
    if (page > 0) {
      pdf.addPage();
    }

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', margin[1], margin[0], innerWidth, pageHeight);
  }

  pdf.save(filename);
}
