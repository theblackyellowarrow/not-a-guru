import { FilePlus, HelpCircle, MessageSquareQuote, SearchCheck, Wrench } from 'lucide-react';

const options = [
  {
    key: 'start_project',
    icon: FilePlus,
    title: 'Start a New Vibe',
    description: "Got a spark of an idea? Let's see if it's fire.",
  },
  {
    key: 'process_review',
    icon: Wrench,
    title: 'Process Check',
    description: "In the weeds? Let's untangle your process docs.",
  },
  {
    key: 'final_review',
    icon: SearchCheck,
    title: 'Final Roast',
    description: "Think you're done? Let's get this final critique.",
  },
  {
    key: 'venting_mode',
    icon: MessageSquareQuote,
    title: 'Just Venting / FAQ',
    description: 'Sound off about a bad crit, or just ask how this thing works.',
  },
];

export default function Onboarding({ onSelect, onOpenHelp, isLoading }) {
  return (
    <div className="bg-main text-primary font-sans flex flex-col h-screen antialiased items-center justify-center p-4">
      <div className="text-center max-w-5xl">
        <img
          src="/brand/dotai-logo-mark.png"
          alt="DotAI"
          className="mx-auto mb-4 h-12 w-auto opacity-95"
          loading="eager"
        />
        <h1 className="text-4xl font-bold text-primary mb-2 uppercase font-mono">Not a Guru</h1>
        <p className="text-accent text-lg mb-6">The design peer who keeps it real. Attention over fluff.</p>
        <button
          onClick={onOpenHelp}
          className="inline-flex items-center gap-2 border border-main px-4 py-2 text-sm font-semibold uppercase font-mono text-secondary hover:border-accent hover:text-primary"
        >
          <HelpCircle size={16} />
          How to Use
        </button>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {options.map((opt) => {
            const Icon = opt.icon;

            return (
              <button
                key={opt.key}
                onClick={() => onSelect(opt.key)}
                disabled={isLoading}
                className="bg-card-alt group border-2 border-main p-8 text-left hover:bg-accent-subtle hover:border-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
              >
                <div className="mb-4">
                  <Icon size={32} className="text-muted group-hover:text-primary transition-colors" />
                </div>
                <h2 className="font-semibold text-xl text-primary mb-1 uppercase font-mono">{opt.title}</h2>
                <p className="text-base text-muted">{opt.description}</p>
              </button>
            );
          })}
        </div>

        {isLoading && <div className="mt-8 text-accent">Loading session...</div>}
      </div>
    </div>
  );
}
