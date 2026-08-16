import { ArrowRight, Sparkles } from 'lucide-react';

export default function NextQuestCard({ title, body, actions, onSelect, isLoading }) {
  return (
    <div className="my-6 border-2 border-[#FF00A8] bg-[#4A002D]/20 p-4">
      <div className="flex items-center gap-2 text-[#FF00A8] uppercase font-mono text-[10px] tracking-[0.15em]">
        <Sparkles size={14} /> {title}
      </div>
      <p className="mt-2 text-sm text-[#EFEDE8]">{body}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.flow}
            onClick={() => onSelect(action.flow)}
            disabled={isLoading}
            className="group flex items-center gap-2 border border-[#FF00A8] bg-[#FF00A8]/10 px-4 py-2 text-sm uppercase font-mono text-[#FF00A8] transition-all hover:bg-[#FF00A8] hover:text-black disabled:opacity-50 clip-corner"
          >
            {action.label} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}
