import { jsPDF } from 'jspdf';

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
