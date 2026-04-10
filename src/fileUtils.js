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
    const pdfjsLib = await loadPdfJs();
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
    const mammoth = await loadMammoth();
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

let pdfJsCache;
async function loadPdfJs() {
  if (pdfJsCache) {
    return pdfJsCache;
  }

  const [pdfjsLib, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
  pdfJsCache = pdfjsLib;
  return pdfJsCache;
}

let mammothCache;
async function loadMammoth() {
  if (mammothCache) {
    return mammothCache;
  }

  const mammothModule = await import('mammoth');
  mammothCache = mammothModule.default;
  return mammothCache;
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
