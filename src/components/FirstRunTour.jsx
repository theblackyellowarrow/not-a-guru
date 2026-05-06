import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

const STEPS = [
  {
    title: 'Pick a Mode',
    body: 'Start with the landing screen. Choose Start a New Vibe for framing, Process Check for docs, Final Roast for final critique, or Just Venting for quick support.',
  },
  {
    title: 'Use Uploads Strategically',
    body: 'For Process Check and Final Roast, upload only the documents that actually support your claims. Thin evidence produces thin critique.',
  },
  {
    title: 'Keep It Moving',
    body: 'If you get stuck, use the Help button. Replies are designed to end with one sharp next question so you always have a concrete next step.',
  },
];

export default function FirstRunTour({ isOpen, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);

  const step = useMemo(() => STEPS[stepIndex] || STEPS[0], [stepIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl border-2 border-gray-800 bg-gray-950 text-gray-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-xl font-semibold uppercase font-mono">Quick Tour</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close tour">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3 text-sm leading-relaxed">
          <div className="text-xs uppercase font-mono text-gray-500">
            Step {stepIndex + 1} of {STEPS.length}
          </div>
          <div className="text-lg font-semibold uppercase font-mono text-gray-200">{step.title}</div>
          <div className="text-gray-400">{step.body}</div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            className="border border-gray-800 px-4 py-2 text-sm font-semibold uppercase font-mono text-gray-300 hover:border-fuchsia-500 hover:text-white disabled:opacity-40"
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="border border-gray-800 px-4 py-2 text-sm font-semibold uppercase font-mono text-gray-300 hover:border-fuchsia-500 hover:text-white"
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
              className="border border-fuchsia-500 px-4 py-2 text-sm font-semibold uppercase font-mono text-fuchsia-300 hover:bg-fuchsia-900/30"
            >
              {stepIndex >= STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
