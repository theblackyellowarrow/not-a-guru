import { ArrowRight, Sparkles } from 'lucide-react';

export default function NextQuestCard({ title, body, actions, onSelect, isLoading }) {
  return (
    <div className="my-6 border-2 border-cyan-400 bg-cyan-900/10 p-4">
      <div className="flex items-center gap-2 text-cyan-300 uppercase font-mono text-sm tracking-widest">
        <Sparkles size={16} /> {title}
      </div>
      <p className="mt-2 text-sm text-gray-300">{body}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.flow}
            onClick={() => onSelect(action.flow)}
            disabled={isLoading}
            className="flex items-center gap-2 border-2 border-cyan-700 bg-cyan-900/20 px-4 py-2 text-sm uppercase font-mono text-cyan-200 transition-colors hover:bg-cyan-900/40 hover:border-cyan-400 disabled:opacity-50"
          >
            {action.label} <ArrowRight size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
