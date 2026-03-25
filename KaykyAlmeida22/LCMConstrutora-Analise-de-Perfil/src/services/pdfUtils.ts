import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// LAST RESORT: Disable worker to avoid "this[#methodPromises].getOrInsertComputed is not a function"
// This forces pdf.js to run in the main thread, which is safer for some Vite environments.
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

/**
 * Converts an image file (JPG/PNG) into a single-page PDF blob.
 * Used to ensure all documents are stored as PDF in Supabase.
 */
export async function imageToPdf(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgData = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Create PDF with the image dimensions (in mm, 1px ≈ 0.264583mm)
        const pxToMm = 0.264583;
        const widthMm = img.width * pxToMm;
        const heightMm = img.height * pxToMm;

        const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
        const doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: [widthMm, heightMm],
        });

        const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
        doc.addImage(imgData, format, 0, 0, widthMm, heightMm);

        const pdfBlob = doc.output('blob');
        resolve(pdfBlob);
      };
      img.onerror = () => reject(new Error('Falha ao carregar a imagem para conversão em PDF.'));
      img.src = imgData;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Renders the first page of a PDF file as a base64 PNG string.
 * Used to send PDFs to the OpenAI Vision API.
 */
export async function pdfToImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  // Render at 2x scale for clarity
  const scale = 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

  // Return as base64 data URL
  return canvas.toDataURL('image/png');
}

/**
 * Converts a File to a base64 data URL string.
 * Used for sending images directly to GPT-4o.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}
