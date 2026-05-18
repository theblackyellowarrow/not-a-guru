import { X } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl border-2 border-main bg-elevated text-primary shadow-xl">
        <div className="flex items-center justify-between border-b border-main px-6 py-4">
          <h2 className="text-xl font-semibold uppercase font-mono">How to Use Not a Guru</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary"
            aria-label="Close help"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm leading-relaxed">
          <div>
            <p className="text-secondary">
              Pick a mode on the landing screen. Each mode gives a different type of critique.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="border border-main bg-card px-4 py-3">
              <div className="font-semibold uppercase font-mono text-primary">Start a New Vibe</div>
              <div className="text-muted">Talk through an idea and shape it into a clear problem + solution.</div>
            </div>
            <div className="border border-main bg-card px-4 py-3">
              <div className="font-semibold uppercase font-mono text-primary">Process Check</div>
              <div className="text-muted">
                Upload research/process docs. The critique ties weak outputs back to missing research.
              </div>
            </div>
            <div className="border border-main bg-card px-4 py-3">
              <div className="font-semibold uppercase font-mono text-primary">Final Roast</div>
              <div className="text-muted">
                Upload final assets plus framing docs. You'll get a direct critique of the final output.
              </div>
            </div>
            <div className="border border-main bg-card px-4 py-3">
              <div className="font-semibold uppercase font-mono text-primary">Just Venting / FAQ</div>
              <div className="text-muted">Short support + quick directional questions.</div>
            </div>
          </div>
          <div className="text-muted">
            Tip: Keep uploads lean (PDF/DOCX/images). For faster replies, keep messages focused.
          </div>
        </div>
        <div className="border-t border-main px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="border border-accent px-4 py-2 text-sm font-semibold uppercase font-mono text-accent hover:bg-accent-subtle"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
