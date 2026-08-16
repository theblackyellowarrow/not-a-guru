import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

const STEPS = [
  {
    title: 'Pick a Mode',
    body: 'Choose Build a Problem Statement to frame an idea, Design Process Critique to review your process, or Final Roast for a finished piece.',
  },
  {
    title: 'Upload as You Go',
    body: 'In any chat you can upload PDFs, DOCX files, or images when they support the critique. Process Critique and Final Roast expect evidence.',
  },
  {
    title: 'Keep It Moving',
    body: 'Replies end with one sharp next question. Use quick chips if you’re stuck. Each stage earns a score, and once a quest is complete you can download a dotai marksheet.',
  },
];

export default function FirstRunTour({ isOpen, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);

  const step = useMemo(() => STEPS[stepIndex] || STEPS[0], [stepIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl border border-[#F7F5F0] bg-[#090909] text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#6B6965] px-6 py-4">
          <h2 className="text-xl font-semibold uppercase font-mono tracking-wider">Quick Tour</h2>
          <button onClick={onClose} className="text-[#C8C5BF] hover:text-white transition-colors" aria-label="Close tour">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3 text-sm leading-relaxed">
          <div className="text-[10px] uppercase font-mono text-[#6B6965] tracking-[0.15em]">
            Step {stepIndex + 1} of {STEPS.length}
          </div>
          <div className="text-lg font-semibold uppercase font-mono tracking-wider text-white">{step.title}</div>
          <div className="text-[#C8C5BF]">{step.body}</div>
        </div>
        <div className="border-t border-[#6B6965] px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            className="border border-[#6B6965] px-4 py-2 text-sm font-semibold uppercase font-mono text-[#C8C5BF] hover:border-[#00F1DE] hover:text-white disabled:opacity-40 transition-colors"
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="border border-[#6B6965] px-4 py-2 text-sm font-semibold uppercase font-mono text-[#C8C5BF] hover:border-[#00F1DE] hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => {
                if (stepIndex >= STEPS.length - 1) {
                  onClose();
                  return;
                }
                setStepIndex((prev) => prev + 1);
              }}
              className="bg-[#FF00A8] text-black px-4 py-2 text-sm font-semibold uppercase font-mono tracking-wider hover:brightness-110 transition-all clip-corner"
            >
              {stepIndex >= STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
