import { X } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl border-2 border-gray-800 bg-gray-950 text-gray-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-xl font-semibold uppercase font-mono">How to Use Not a Guru</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close help"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm leading-relaxed">
          <div>
            <p className="text-gray-300">
              Pick a mode on the landing screen. Each mode gives a different type of critique.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="border border-gray-800 bg-gray-900/60 px-4 py-3">
              <div className="font-semibold uppercase font-mono text-gray-200">Start a New Vibe</div>
              <div className="text-gray-400">Talk through an idea and shape it into a clear problem + solution.</div>
            </div>
            <div className="border border-gray-800 bg-gray-900/60 px-4 py-3">
              <div className="font-semibold uppercase font-mono text-gray-200">Process Check</div>
              <div className="text-gray-400">
                Upload research/process docs. The critique ties weak outputs back to missing research.
              </div>
            </div>
            <div className="border border-gray-800 bg-gray-900/60 px-4 py-3">
              <div className="font-semibold uppercase font-mono text-gray-200">Final Roast</div>
              <div className="text-gray-400">
                Upload final assets plus framing docs. You’ll get a direct critique of the final output.
              </div>
            </div>
            <div className="border border-gray-800 bg-gray-900/60 px-4 py-3">
              <div className="font-semibold uppercase font-mono text-gray-200">Just Venting / FAQ</div>
              <div className="text-gray-400">Short support + quick directional questions.</div>
            </div>
          </div>
          <div className="text-gray-400">
            Tip: Keep uploads lean (PDF/DOCX/images). For faster replies, keep messages focused.
          </div>
        </div>
        <div className="border-t border-gray-800 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="border border-fuchsia-500 px-4 py-2 text-sm font-semibold uppercase font-mono text-fuchsia-300 hover:bg-fuchsia-900/30"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
