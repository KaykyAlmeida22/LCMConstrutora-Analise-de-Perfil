import { jsPDF } from 'jspdf';
import * as pdfjs from 'pdfjs-dist';

// Correctly resolve the PDF worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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
 * Converts a PDF file to an image (data URL) of its first page.
 * Used to provide visual input to GPT-4o for document validation.
 */
export async function pdfToImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Falha ao criar contexto de canvas.');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Converts a File to a base64 data URL string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}
