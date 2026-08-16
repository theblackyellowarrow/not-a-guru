import { X } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl border border-[#F7F5F0] bg-[#090909] text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#6B6965] px-6 py-4">
          <h2 className="text-xl font-semibold uppercase font-mono tracking-wider">How to Use Not a Guru</h2>
          <button
            onClick={onClose}
            className="text-[#C8C5BF] hover:text-white transition-colors"
            aria-label="Close help"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm leading-relaxed">
          <div>
            <p className="text-[#C8C5BF]">
              Pick a mode on the landing screen. Each mode gives a different kind of critique.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="border border-[#6B6965] bg-[#0f0f0f] px-4 py-3 hover:border-[#00F1DE] transition-colors">
              <div className="font-semibold uppercase font-mono tracking-wider text-white">Build a Problem Statement</div>
              <div className="text-[#C8C5BF] mt-1">
                Talk through a raw idea until it becomes a sharp, scored problem statement, then a solution statement and a future workflow.
              </div>
            </div>
            <div className="border border-[#6B6965] bg-[#0f0f0f] px-4 py-3 hover:border-[#00F1DE] transition-colors">
              <div className="font-semibold uppercase font-mono tracking-wider text-white">Design Process Critique</div>
              <div className="text-[#C8C5BF] mt-1">
                Chat through your process and upload docs or images. The critique traces weak outputs back to shaky research or assumptions.
              </div>
            </div>
            <div className="border border-[#6B6965] bg-[#0f0f0f] px-4 py-3 hover:border-[#00F1DE] transition-colors">
              <div className="font-semibold uppercase font-mono tracking-wider text-white">Final Roast</div>
              <div className="text-[#C8C5BF] mt-1">
                Upload final assets and framing. You’ll get a direct critique of the finished work.
              </div>
            </div>
          </div>
          <div className="text-[#C8C5BF]">
            Tip: Keep uploads lean (PDF/DOCX/images). For faster replies, keep messages focused.
          </div>
        </div>
        <div className="border-t border-[#6B6965] px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="bg-[#FF00A8] text-black px-4 py-2 text-sm font-semibold uppercase font-mono tracking-wider hover:brightness-110 transition-all clip-corner"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
