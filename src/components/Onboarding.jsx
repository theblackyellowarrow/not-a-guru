import { FilePlus, HelpCircle, MessageSquareQuote, SearchCheck, Swords, Unlock, Wrench, Zap } from 'lucide-react';

const quests = [
  {
    key: 'start_project',
    icon: FilePlus,
    tag: 'Quest: Framing',
    title: 'Start a New Vibe',
    description: 'Raw idea to a defensible problem and solution. Three stages.',
  },
  {
    key: 'process_review',
    icon: Wrench,
    tag: 'Quest: Evidence',
    title: 'Process Check',
    description: 'Upload the working. Every claim traced back to research.',
  },
  {
    key: 'final_review',
    icon: SearchCheck,
    tag: 'Quest: The Finish',
    title: 'Final Roast',
    description: 'Final output on the table. No mercy, only specifics.',
  },
  {
    key: 'venting_mode',
    icon: MessageSquareQuote,
    tag: 'No quest',
    title: 'Just Venting / FAQ',
    description: 'Sound off about a bad crit, or ask how this thing works.',
  },
];

const steps = [
  {
    icon: Swords,
    title: 'Pick a quest',
    body: 'Four modes, each a different kind of critique. None of them polite filler.',
  },
  {
    icon: Zap,
    title: 'One question at a time',
    body: 'No essays. Short answers, sharp follow-ups. Tap a quick chip if typing feels like homework.',
  },
  {
    icon: Unlock,
    title: 'Clear stages, unlock tools',
    body: 'Advance the tracker. Draft personas and the bias check unlock as you go.',
  },
];

export default function Onboarding({ onSelect, onOpenHelp, isLoading }) {
  return (
    <div className="view-enter bg-black text-gray-200 font-sans min-h-screen antialiased overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-10 text-center">
        <img
          src="/brand/dotai-logo-mark.png"
          alt="dotai"
          className="mx-auto mb-4 h-12 w-auto opacity-95"
          loading="eager"
        />
        <h1 className="text-4xl font-bold text-gray-200 mb-2 uppercase font-mono">Not a Guru</h1>
        <p className="text-cyan-400 text-lg">The design peer who keeps it real. Attention over fluff.</p>
        <button
          onClick={onOpenHelp}
          className="mt-4 inline-flex items-center gap-2 border border-gray-800 px-4 py-2 text-sm font-semibold uppercase font-mono text-gray-300 hover:border-cyan-400 hover:text-white"
        >
          <HelpCircle size={16} />
          How to Use
        </button>

        <div className="mt-12">
          <h2 className="text-sm uppercase font-mono tracking-widest text-gray-500">How it plays</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="border-2 border-gray-800 bg-gray-900/60 p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400">
                      <Icon size={20} />
                    </span>
                    <span className="text-xs uppercase font-mono tracking-widest text-gray-500">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-lg text-gray-200 uppercase font-mono">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-sm uppercase font-mono tracking-widest text-gray-500">Choose your quest</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quests.map((quest) => {
              const Icon = quest.icon;

              return (
                <button
                  key={quest.key}
                  onClick={() => onSelect(quest.key)}
                  disabled={isLoading}
                  className="bg-gray-900/70 group border-2 border-gray-800 p-6 text-left hover:bg-cyan-900/20 hover:border-cyan-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={28} className="text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] uppercase font-mono tracking-widest text-gray-600 group-hover:text-cyan-400 transition-colors">
                      {quest.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-xl text-gray-200 mb-1 uppercase font-mono">{quest.title}</h3>
                  <p className="text-sm text-gray-400">{quest.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading && <div className="mt-8 text-cyan-400">Loading session...</div>}

        <div className="mt-14 border-t-2 border-gray-800 pt-8">
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Not a Guru is built by <span className="text-gray-200 font-semibold">dotai</span> — a design and AI
            practice making tools that keep design work honest. See the rest of the work at{' '}
            <a
              href="https://dotai.org"
              target="_blank"
              rel="noreferrer noopener"
              className="text-cyan-400 underline hover:text-cyan-300"
            >
              dotai.org
            </a>
            .
          </p>
          <p className="mt-4 text-xs text-gray-600 font-mono tracking-widest">powered by dotai</p>
        </div>
      </div>
    </div>
  );
}
