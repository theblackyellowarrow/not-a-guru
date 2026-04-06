import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function parseUploadedFile(file) {
  const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  if (supportedImageTypes.includes(file.type)) {
    const base64 = await readFileAsDataUrl(file);
    return {
      name: file.name,
      type: file.type,
      base64: base64.split(',')[1],
    };
  }

  if (file.type === 'application/pdf') {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += `${textContent.items.map((item) => item.str).join(' ')}\n`;
    }

    return {
      name: file.name,
      type: file.type,
      content: fullText.trim(),
    };
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  ) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });

    return {
      name: file.name,
      type: file.type,
      content: result.value,
    };
  }

  throw new Error(`Unsupported file type: ${file.type || 'unknown'}. Please use images, PDFs, or .docx files.`);
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}
