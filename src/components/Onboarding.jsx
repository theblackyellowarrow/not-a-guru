import { BrainCircuit, FilePlus, HelpCircle, MessageSquareQuote, SearchCheck, Wrench } from 'lucide-react';

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
    <div className="bg-black text-gray-200 font-sans flex flex-col h-screen antialiased items-center justify-center p-4">
      <div className="text-center max-w-5xl">
        <BrainCircuit size={48} className="mx-auto text-gray-600 mb-4" />
        <h1 className="text-4xl font-bold text-gray-200 mb-2 uppercase font-mono">Not a Guru</h1>
        <p className="text-fuchsia-500 text-lg mb-6">The design peer who keeps it real. Attention over fluff.</p>
        <button
          onClick={onOpenHelp}
          className="inline-flex items-center gap-2 border border-gray-800 px-4 py-2 text-sm font-semibold uppercase font-mono text-gray-300 hover:border-fuchsia-500 hover:text-white"
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
                className="bg-gray-900 group border-2 border-gray-800 p-8 text-left hover:bg-fuchsia-900/50 hover:border-fuchsia-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
              >
                <div className="mb-4">
                  <Icon size={32} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <h2 className="font-semibold text-xl text-gray-200 mb-1 uppercase font-mono">{opt.title}</h2>
                <p className="text-base text-gray-400">{opt.description}</p>
              </button>
            );
          })}
        </div>

        {isLoading && <div className="mt-8 text-fuchsia-500">Loading session...</div>}
      </div>
    </div>
  );
}
