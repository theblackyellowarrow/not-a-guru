import { CheckCircle, FileText } from 'lucide-react';
import { useRef, useState } from 'react';

export default function FileStagingScreen({
  title,
  description,
  requiredFiles,
  minOptional,
  onSubmit,
  onBack,
}) {
  const [stagedFiles, setStagedFiles] = useState({});
  const [currentUploadKey, setCurrentUploadKey] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const compulsoryFiles = requiredFiles.filter((file) => file.compulsory);
  const optionalFiles = requiredFiles.filter((file) => !file.compulsory);
  const compulsoryUploaded = compulsoryFiles.every((file) => stagedFiles[file.key]);
  const optionalUploadedCount = optionalFiles.filter((file) => stagedFiles[file.key]).length;
  const canSubmit = compulsoryUploaded && optionalUploadedCount >= minOptional;
  const totalUploadedCount = Object.keys(stagedFiles).length;
  const totalRequiredCount = compulsoryFiles.length + minOptional;

  function handleFileSelect(key) {
    setError(null);
    setCurrentUploadKey(key);
    fileInputRef.current?.click();
  }

  const MAX_FILE_SIZE = 20 * 1024 * 1024;

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !currentUploadKey) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
      event.target.value = '';
      return;
    }

    const targetConfig = requiredFiles.find((item) => item.key === currentUploadKey);
    if (targetConfig?.isImage && !file.type.startsWith('image/')) {
      setError('This upload must be an image file.');
      event.target.value = '';
      return;
    }

    setError(null);
    setStagedFiles((prev) => ({ ...prev, [currentUploadKey]: file }));
    event.target.value = '';
  }

  return (
    <div className="bg-main text-primary font-sans flex flex-col h-screen antialiased items-center justify-center p-4">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-accent mb-2 uppercase font-mono">{title}</h1>
        <p className="text-center text-muted mb-8 text-lg">{description}</p>
        {error && <p className="mb-4 border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-200">{error}</p>}
        <div className="bg-card border-2 border-main p-6 space-y-4">
          {requiredFiles.map(({ key, label, compulsory }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-card-alt">
              <div className="flex items-center gap-3">
                {stagedFiles[key] ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <FileText size={20} className="text-muted" />
                )}
                <div>
                  <span className="text-primary uppercase font-mono">
                    {label} {compulsory && <span className="text-accent font-bold">*</span>}
                  </span>
                  {stagedFiles[key] && (
                    <p className="text-xs text-muted truncate max-w-xs">{stagedFiles[key].name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleFileSelect(key)}
                className="text-sm text-accent hover:text-primary font-semibold uppercase font-mono"
              >
                {stagedFiles[key] ? 'Change' : 'Upload'}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <button onClick={onBack} className="text-muted hover:text-primary uppercase font-mono">
            &larr; Back
          </button>
          <button
            onClick={() => onSubmit(stagedFiles)}
            disabled={!canSubmit}
            className="bg-accent text-primary font-bold py-2 px-6 disabled:bg-muted disabled:cursor-not-allowed hover:opacity-80 transition-colors uppercase font-mono"
          >
            Submit ({totalUploadedCount}/{totalRequiredCount})
          </button>
        </div>
      </div>
    </div>
  );
}
