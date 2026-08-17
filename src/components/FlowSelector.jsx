import { ArrowRight, MessageSquare, BookOpen, Sparkles } from 'lucide-react';
import GeometricBackdrop from './GeometricBackdrop';
import OrbitMark from './OrbitMark';

const FLOW_CARDS = [
  {
    key: 'start_project',
    number: '1st',
    title: 'Build a Problem Statement',
    description: 'Start from a raw idea. Shape it into a sharp, defensible problem statement, then a focused solution.',
    icon: MessageSquare,
    recommended: true,
  },
  {
    key: 'process_review',
    number: '2nd',
    title: 'Design Process Critique',
    description: 'Interrogate how you got here — research, decisions, dead ends. Upload docs and walk through the process.',
    icon: BookOpen,
    recommended: false,
  },
  {
    key: 'final_review',
    number: '3rd',
    title: 'Final Roast',
    description: 'Put the finished piece on the table. A direct critique of output through desirability, viability, feasibility.',
    icon: Sparkles,
    recommended: false,
  },
];

export default function FlowSelector({ username, onSelectFlow, onOpenHelp }) {
  return (
    <div className="view-enter bg-[#090909] text-white min-h-screen antialiased overflow-y-auto">
      <GeometricBackdrop />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="flex flex-col items-center text-center mb-8 md:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <OrbitMark size={32} />
            <h1 className="text-3xl md:text-4xl font-semibold text-white uppercase font-mono tracking-[0.12em]">
              Not a Guru
            </h1>
          </div>
          {username && (
            <p className="text-[#00F1DE] text-lg font-medium tracking-wide">
              Welcome, <span className="text-[#FF00A8] font-semibold">{username}</span>
            </p>
          )}
        </header>

        {/* Certificate note */}
        <div className="mb-10 border border-[#00F1DE] bg-[#003D39]/30 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-[#00F1DE] bg-[#090909]">
              <Sparkles size={20} className="text-[#00F1DE]" />
            </div>
            <div>
              <p className="text-sm text-white leading-relaxed">
                <span className="text-[#00F1DE] font-semibold">For the full Design Ninja certificate</span>, begin at the{' '}
                <span className="text-[#FF00A8] font-semibold">1st</span>. Complete all three flows to earn your rank.
              </p>
              <p className="mt-2 text-xs text-[#9A968D]">
                But feel free to try anything — each flow stands on its own.
              </p>
            </div>
          </div>
        </div>

        {/* Flow cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FLOW_CARDS.map((flow) => (
            <button
              key={flow.key}
              onClick={() => onSelectFlow(flow.key)}
              className={`group relative text-left border transition-all duration-200 hover:scale-[1.02] focus:outline-none ${
                flow.recommended
                  ? 'border-[#00F1DE] bg-[#003D39]/20'
                  : 'border-[#6B6965] bg-[#090909]/90 hover:border-[#00F1DE]/60'
              }`}
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
              }}
            >
              {/* Recommended badge */}
              {flow.recommended && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-[#FF00A8] text-black text-[10px] uppercase font-mono tracking-wider">
                  Recommended
                </div>
              )}

              <div className="p-6">
                {/* Number and icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#6B6965] font-mono text-sm">{flow.number}</span>
                  <div className={`w-10 h-10 flex items-center justify-center border ${
                    flow.recommended ? 'border-[#00F1DE]' : 'border-[#6B6965]'
                  }`}>
                    <flow.icon size={18} className={flow.recommended ? 'text-[#00F1DE]' : 'text-[#C8C5BF]'} />
                  </div>
                </div>

                {/* Title */}
                <h2 className={`text-lg font-semibold mb-2 ${flow.recommended ? 'text-[#00F1DE]' : 'text-white'}`}>
                  {flow.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-[#9A968D] leading-relaxed mb-6">
                  {flow.description}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider">
                  <span className={flow.recommended ? 'text-[#FF00A8]' : 'text-[#6B6965] group-hover:text-[#00F1DE]'}>
                    Begin
                  </span>
                  <ArrowRight size={14} className={`transition-transform group-hover:translate-x-1 ${
                    flow.recommended ? 'text-[#FF00A8]' : 'text-[#6B6965] group-hover:text-[#00F1DE]'
                  }`} />
                </div>
              </div>

              {/* Hover accent line */}
              <div className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${
                flow.recommended ? 'w-full bg-[#00F1DE]' : 'w-0 group-hover:w-full bg-[#00F1DE]/60'
              }`} />
            </button>
          ))}
        </div>

        {/* Help link */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenHelp}
            className="text-xs text-[#6B6965] hover:text-[#00F1DE] transition-colors font-mono uppercase tracking-wider"
          >
            Need help choosing?
          </button>
        </div>
      </div>
    </div>
  );
}
