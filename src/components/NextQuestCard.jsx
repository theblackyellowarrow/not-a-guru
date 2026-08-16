import { ArrowRight, Sparkles } from 'lucide-react';

export default function NextQuestCard({ title, body, actions, onSelect, isLoading }) {
  return (
    <div className="my-6 border-2 border-[#00F1DE] bg-[#003D39]/40 p-4">
      <div className="flex items-center gap-2 text-[#00F1DE] uppercase font-mono text-[10px] tracking-[0.15em]">
        <Sparkles size={14} /> {title}
      </div>
      <p className="mt-2 text-sm text-[#EFEDE8]">{body}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.flow}
            onClick={() => onSelect(action.flow)}
            disabled={isLoading}
            className="group flex items-center gap-2 border border-white bg-[#F7F5F0] text-black px-4 py-2 text-sm uppercase font-mono transition-all hover:border-[#00F1DE] hover:shadow-[3px_3px_0_0_#00F1DE] disabled:opacity-50 clip-corner"
          >
            {action.label} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}
