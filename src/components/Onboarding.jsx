import { FilePlus, HelpCircle, SearchCheck, Swords, Unlock, Wrench, Zap } from 'lucide-react';
import GeometricBackdrop from './GeometricBackdrop';

const quests = [
  {
    key: 'start_project',
    icon: FilePlus,
    tag: 'Quest: Framing',
    title: 'Build a Problem Statement',
    description: 'Raw idea → scored problem statement → solution statement → future workflow.',
  },
  {
    key: 'process_review',
    icon: Wrench,
    tag: 'Quest: Process',
    title: 'Design Process Critique',
    description: 'Chat through your process and upload evidence. Trace weak outputs back to shaky research.',
  },
  {
    key: 'final_review',
    icon: SearchCheck,
    tag: 'Quest: The Finish',
    title: 'Final Roast',
    description: 'Show the finished work. A direct critique of output, framing, and intent.',
  },
];

const steps = [
  {
    icon: Swords,
    title: 'Pick a quest',
    body: 'Three modes: frame a problem, critique your process, or roast the final piece.',
  },
  {
    icon: Zap,
    title: 'One question at a time',
    body: 'Short answers, sharp follow-ups. Upload PDFs and images whenever they help.',
  },
  {
    icon: Unlock,
    title: 'Clear stages, unlock tools',
    body: 'Advance the tracker. Score your problem statement and unlock the bias check as you go.',
  },
];

export default function Onboarding({ onSelect, onOpenHelp, isLoading }) {
  return (
    <div className="view-enter bg-[#090909] text-white min-h-screen antialiased overflow-y-auto">
      <GeometricBackdrop />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 text-center">
        <img
          src="/brand/dotai-logo-mark.png"
          alt="dotai"
          className="mx-auto mb-4 h-12 w-auto opacity-95"
          loading="eager"
        />
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-2 uppercase font-mono tracking-wider">
          Not a Guru
        </h1>
        <p className="text-[#FF00A8] text-lg font-medium">The design peer who keeps it real. Attention over fluff.</p>
        <button
          onClick={onOpenHelp}
          className="mt-4 inline-flex items-center gap-2 border border-[#F7F5F0] px-4 py-2 text-sm font-semibold uppercase font-mono text-[#F7F5F0] hover:border-[#FF00A8] hover:text-[#FF00A8] transition-colors clip-corner"
        >
          <HelpCircle size={16} />
          How to Use
        </button>

        <div className="mt-12">
          <h2 className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#6B6965]">How it plays</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="border border-[#F7F5F0] bg-[#090909]/80 p-5 hover:border-[#FF00A8] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[#FF00A8]">
                      <Icon size={20} />
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-[0.15em] text-[#6B6965]">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-lg text-white uppercase font-mono tracking-wider">{step.title}</h3>
                  <p className="mt-1 text-sm text-[#C8C5BF]">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#6B6965]">Choose your quest</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            {quests.map((quest) => {
              const Icon = quest.icon;

              return (
                <button
                  key={quest.key}
                  onClick={() => onSelect(quest.key)}
                  disabled={isLoading}
                  className="group text-left border border-[#F7F5F0] bg-[#090909]/80 p-6 hover:border-[#FF00A8] hover:bg-[#4A002D]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait clip-corner"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={28} className="text-[#F7F5F0] group-hover:text-white transition-colors" />
                    <span className="text-[10px] uppercase font-mono tracking-[0.15em] text-[#6B6965] group-hover:text-[#FF00A8] transition-colors">
                      {quest.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-xl text-white mb-1 uppercase font-mono tracking-wider">
                    {quest.title}
                  </h3>
                  <p className="text-sm text-[#C8C5BF]">{quest.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading && <div className="mt-8 text-[#FF00A8] font-mono uppercase text-sm">Loading session…</div>}

        <div className="mt-14 border-t border-[#6B6965] pt-8">
          <p className="text-[#C8C5BF] text-sm max-w-2xl mx-auto">
            Not a Guru is built by <span className="text-white font-semibold">dotai</span> — a design and AI
            practice making tools that keep design work honest. See the rest of the work at{' '}
            <a
              href="https://dotai.org"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#FF00A8] underline hover:text-[#FFD6EE] transition-colors"
            >
              dotai.org
            </a>
            .
          </p>
          <p className="mt-4 text-[10px] text-[#6B6965] font-mono tracking-[0.2em]">powered by dotai</p>
        </div>
      </div>
    </div>
  );
}
